/**
 * Glossary of one stage: short explanations of the parts or concepts that answer options
 * can name. The Tutor uses it to explain a mix-up (design doc 6.1).
 * Writing it is the only Tutor work a stage needs: no code.
 */
export interface GlossaryTerm {
  id: string;
  /** Name shown on the page */
  name: string;
  /** Other ways the term is written in answer options, for example "ALU" */
  aliases?: string[];
  /** 1 to 2 sentences: what it is and what it does */
  text: string;
}

export interface Contrast {
  /** Ids of two terms, in any order */
  between: [string, string];
  /** 1 to 3 sentences: how to tell the two apart */
  text: string;
}
