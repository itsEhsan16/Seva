// Content moderation utility for detecting inappropriate content in reviews

const INAPPROPRIATE_WORDS = [
  // Profanity
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'jerk', 'ass',
  // Spam indicators
  'click here', 'visit my website', 'call me at', 'email me', 'whatsapp',
  // Discriminatory language
  'racist', 'sexist', 'homophobic', 'transphobic',
  // Personal information patterns (basic detection)
  '@gmail.com', '@yahoo.com', '@hotmail.com', 'phone:', 'tel:', 'mobile:',
];

const SPAM_PATTERNS = [
  /\b\d{10,}\b/, // Phone numbers (10+ digits)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
  /https?:\/\/[^\s]+/, // URLs
  /www\.[^\s]+/, // Website URLs
  /\b(call|text|whatsapp)\s+(me|us)\b/i, // Contact requests
];

export interface ModerationResult {
  isAppropriate: boolean;
  flags: string[];
  confidence: number;
}

export const moderateContent = (content: string): ModerationResult => {
  const flags: string[] = [];
  let inappropriateScore = 0;
  
  if (!content || content.trim().length === 0) {
    return {
      isAppropriate: true,
      flags: [],
      confidence: 1.0
    };
  }

  const lowerContent = content.toLowerCase();
  
  // Check for inappropriate words
  INAPPROPRIATE_WORDS.forEach(word => {
    if (lowerContent.includes(word.toLowerCase())) {
      flags.push(`Contains inappropriate language: "${word}"`);
      inappropriateScore += 0.3;
    }
  });

  // Check for spam patterns
  SPAM_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      const patternNames = [
        'phone number',
        'email address', 
        'URL',
        'website URL',
        'contact request'
      ];
      flags.push(`Contains spam pattern: ${patternNames[index] || 'unknown'}`);
      inappropriateScore += 0.4;
    }
  });

  // Check for excessive capitalization (potential shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 10) {
    flags.push('Excessive capitalization detected');
    inappropriateScore += 0.2;
  }

  // Check for repetitive characters (spam indicator)
  if (/(.)\1{4,}/.test(content)) {
    flags.push('Repetitive characters detected');
    inappropriateScore += 0.2;
  }

  // Check for very short reviews (potential spam)
  if (content.trim().length < 10) {
    flags.push('Review too short');
    inappropriateScore += 0.1;
  }

  // Check for very long reviews (potential spam)
  if (content.length > 1000) {
    flags.push('Review too long');
    inappropriateScore += 0.1;
  }

  const confidence = Math.min(inappropriateScore, 1.0);
  const isAppropriate = inappropriateScore < 0.4; // Threshold for auto-approval

  return {
    isAppropriate,
    flags,
    confidence
  };
};

export const shouldAutoApprove = (content: string): boolean => {
  const result = moderateContent(content);
  return result.isAppropriate && result.confidence < 0.2;
};

export const requiresManualReview = (content: string): boolean => {
  const result = moderateContent(content);
  return !result.isAppropriate || result.confidence >= 0.2;
};