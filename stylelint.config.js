/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow CSS custom properties without fallbacks
    'custom-property-empty-line-before': null,
    // Allow class selectors (BEM-ish naming)
    'selector-class-pattern': null,
    // Allow kebab-case and camelCase for custom properties
    'custom-property-pattern': null,
    // Don't require empty lines before comments
    'comment-empty-line-before': null,
    // Allow @import at-rules (we use them in index.css)
    'no-invalid-position-at-import-rule': null,
    // Allow -webkit- prefixes (needed for gradient text)
    'property-no-vendor-prefix': null,
    // Allow descending specificity (common pattern for :hover/:disabled)
    'no-descending-specificity': null,
    // Allow any hex length
    'color-hex-length': null,
    // Allow legacy max-width syntax
    'media-feature-range-notation': null,
    // Allow rgba() syntax
    'color-function-notation': null,
    // Allow rgba instead of rgb
    'color-function-alias-notation': null,
    // Allow 0.6 instead of 60%
    'alpha-value-notation': null,
    // Allow currentColor casing
    'value-keyword-case': null,
    // Allow string import syntax
    'import-notation': null,
  },
};
