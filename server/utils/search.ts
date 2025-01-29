import stringSimilarity from 'string-similarity';
import { distance as getLevenshteinDistance } from 'fastest-levenshtein';
import natural from 'natural';
import { Contact } from '@db/schema';

const soundex = natural.SoundEx;
const metaphone = natural.Metaphone;

interface SearchWeights {
  name: number;
  email: number;
  company: number;
  title: number;
  notes: number;
}

const DEFAULT_WEIGHTS: SearchWeights = {
  name: 1.0,
  email: 0.8,
  company: 0.6,
  title: 0.5,
  notes: 0.3,
};

const SIMILARITY_THRESHOLD = 0.3;

export function calculateFieldSimilarity(query: string, field: string | null): number {
  if (!field || !query) return 0;

  const normalizedQuery = query.toLowerCase();
  const normalizedField = field.toLowerCase();

  // Get different similarity scores
  const stringSim = stringSimilarity.compareTwoStrings(normalizedQuery, normalizedField);
  const levenSim = 1 - (getLevenshteinDistance(normalizedQuery, normalizedField) / Math.max(normalizedQuery.length, normalizedField.length));
  const soundexMatch = soundex.process(normalizedQuery) === soundex.process(normalizedField) ? 1 : 0;
  const metaphoneMatch = metaphone.process(normalizedQuery) === metaphone.process(normalizedField) ? 1 : 0;

  // Token-based similarity for partial matches
  const queryTokens = normalizedQuery.split(/\s+/);
  const fieldTokens = normalizedField.split(/\s+/);
  const tokenSim = queryTokens.reduce((acc, token) => {
    const tokenMatch = fieldTokens.some(fieldToken => 
      stringSimilarity.compareTwoStrings(token, fieldToken) > 0.8
    );
    return acc + (tokenMatch ? 1 : 0);
  }, 0) / queryTokens.length;

  // Return weighted average of different similarity measures
  const similarityScore = (
    (stringSim * 0.3) +
    (levenSim * 0.3) +
    (soundexMatch * 0.2) +
    (metaphoneMatch * 0.1) +
    (tokenSim * 0.1)
  );

  console.log(`Field similarity for "${field}": ${similarityScore}`);
  return similarityScore;
}

export function fuzzySearchContacts(
  contacts: Contact[],
  query: string,
  weights: SearchWeights = DEFAULT_WEIGHTS
): Contact[] {
  if (!query.trim()) return contacts;

  console.log(`Fuzzy searching for: "${query}"`);
  console.log(`Total contacts to search through: ${contacts.length}`);

  const scoredContacts = contacts.map(contact => {
    const scores = {
      name: calculateFieldSimilarity(query, contact.name) * weights.name,
      email: calculateFieldSimilarity(query, contact.email || '') * weights.email,
      company: calculateFieldSimilarity(query, contact.company || '') * weights.company,
      title: calculateFieldSimilarity(query, contact.title || '') * weights.title,
      notes: calculateFieldSimilarity(query, contact.notes || '') * weights.notes,
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const maxPossibleScore = Object.values(weights).reduce((a, b) => a + b, 0);
    const normalizedScore = totalScore / maxPossibleScore;

    console.log(`Contact "${contact.name}" score: ${normalizedScore}`);

    return {
      contact,
      score: normalizedScore,
    };
  });

  const filteredContacts = scoredContacts
    .filter(item => item.score > SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map(item => item.contact);

  console.log(`Found ${filteredContacts.length} matching contacts`);
  return filteredContacts;
}