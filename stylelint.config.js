/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow CSS custom properties without fallbacks
    'custom-property-empty-line-before': null,
    // kebab-case class selectors (with BEM-style -- modifiers)
    'selector-class-pattern': null,
    // Allow kebab-case custom properties
    'custom-property-pattern': null,
    // Don't require empty lines before comments
    'comment-empty-line-before': null,
    // Allow @import at-rules (we use them in index.css)
    'no-invalid-position-at-import-rule': null,
    // Allow -webkit- prefixes (needed for gradient text and scrollbar styling)
    'property-no-vendor-prefix': null,
    // Allow descending specificity (:hover:not(:disabled) before :disabled is intentional)
    'no-descending-specificity': null,
    // Enforce consistent long hex colors (#ffffff not #fff)
    'color-hex-length': 'long',
    // Allow legacy max-width syntax (widely compatible)
    'media-feature-range-notation': null,
    // Keep legacy rgba() syntax (consistent throughout codebase)
    'color-function-notation': null,
    'color-function-alias-notation': null,
    // Keep decimal alpha values (0.6 not 60%)
    'alpha-value-notation': null,
    // Allow string import syntax
    'import-notation': null,
  },
};
