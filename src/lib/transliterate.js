// ═══════════════════════════════════════════
// English → Tamil phonetic transliteration
// Approximate — designed for common Tamil/Indian names
// ═══════════════════════════════════════════

const PULLI = '்';

// Special prefixes that produce complete syllables (checked first)
const SPECIALS = [
  ['shree', 'ஸ்ரீ'],
  ['shri', 'ஸ்ரீ'],
  ['sree', 'ஸ்ரீ'],
  ['sri', 'ஸ்ரீ'],
];

// Consonant patterns — sorted longest-first for greedy matching
const CONSONANTS = [
  // 3-char
  ['ksh', 'க்ஷ'],
  ['nch', 'ஞ்ச'],
  ['shr', 'ஸ்ர'],
  // 2-char doubles
  ['nn', 'ன்ன'],
  ['ll', 'ல்ல'],
  ['mm', 'ம்ம'],
  ['pp', 'ப்ப'],
  ['tt', 'ட்ட'],
  ['kk', 'க்க'],
  ['ss', 'ச்ச'],
  ['rr', 'ற்ற'],
  // 2-char aspirated / compound
  ['sh', 'ஷ'],
  ['ch', 'ச'],
  ['th', 'த'],
  ['dh', 'த'],
  ['bh', 'ப'],
  ['ph', 'ப'],
  ['gh', 'க'],
  ['kh', 'க'],
  ['jh', 'ஜ'],
  ['ng', 'ங'],
  ['nk', 'ங்க'],
  ['nj', 'ஞ'],
  ['nd', 'ந்த'],
  ['nt', 'ந்த'],
  ['sr', 'ஸ்ர'],
  // Single consonants
  ['k', 'க'],
  ['g', 'க'],
  ['c', 'ச'],
  ['s', 'ச'],
  ['j', 'ஜ'],
  ['z', 'ஜ'],
  ['t', 'த'],
  ['d', 'த'],
  ['n', 'ந'],
  ['p', 'ப'],
  ['b', 'ப'],
  ['f', 'ப'],
  ['m', 'ம'],
  ['y', 'ய'],
  ['r', 'ர'],
  ['l', 'ல'],
  ['v', 'வ'],
  ['w', 'வ'],
  ['h', 'ஹ'],
  ['q', 'க'],
  ['x', 'க்ஷ'],
];

// Vowels: [pattern, standalone, mark_after_consonant]
const VOWELS = [
  ['aa', 'ஆ', 'ா'],
  ['ai', 'ஐ', 'ை'],
  ['au', 'ஔ', 'ௌ'],
  ['ou', 'ஔ', 'ௌ'],
  ['ee', 'ஈ', 'ீ'],
  ['oo', 'ஊ', 'ூ'],
  ['ei', 'ஏ', 'ே'],
  ['a', 'அ', ''],       // short a (inherent)
  ['i', 'இ', 'ி'],
  ['u', 'உ', 'ு'],
  ['e', 'ஏ', 'ே'],      // long e — common in names (Devi → தேவி)
  ['o', 'ஓ', 'ோ'],      // long o — common in names (Saroja → சரோஜா)
];

function transliterateWord(word) {
  const lower = word.toLowerCase();
  const len = lower.length;
  let result = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < len) {
    let matched = false;

    // 1. Try special prefixes (produce complete syllables)
    for (const [pattern, tamil] of SPECIALS) {
      if (lower.startsWith(pattern, i)) {
        if (lastWasConsonant) result += PULLI;
        result += tamil;
        i += pattern.length;
        lastWasConsonant = false; // specials end with vowel
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 2. Try consonants (longest first)
    for (const [pattern, tamil] of CONSONANTS) {
      if (lower.startsWith(pattern, i)) {
        if (lastWasConsonant) result += PULLI;
        result += tamil;
        i += pattern.length;
        lastWasConsonant = true;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 3. Try vowels (longest first)
    for (const [pattern, standalone, mark] of VOWELS) {
      if (lower.startsWith(pattern, i)) {
        if (lastWasConsonant) {
          // Final 'a' after consonant → long ா (common in Tamil names)
          if (pattern === 'a' && i + 1 >= len) {
            result += 'ா';
          } else {
            result += mark;
          }
        } else {
          result += standalone;
        }
        i += pattern.length;
        lastWasConsonant = false;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 4. Non-alphabetic — pass through
    if (lastWasConsonant) result += PULLI;
    result += lower[i];
    i++;
    lastWasConsonant = false;
  }

  // End with consonant → add pulli
  if (lastWasConsonant) result += PULLI;

  // Post-process: word-final dental ந் → alveolar ன் (more natural in Tamil)
  result = result.replace(/ந்$/, 'ன்');

  return result;
}

/**
 * Transliterate English text to Tamil script (phonetic approximation).
 * Handles multi-word input, preserving whitespace.
 * @param {string} input - English text to transliterate
 * @returns {string} Tamil transliteration
 */
export function transliterateToTamil(input) {
  if (!input || !input.trim()) return '';
  return input.trim().split(/(\s+)/).map(part =>
    /^\s+$/.test(part) ? part : transliterateWord(part)
  ).join('');
}
