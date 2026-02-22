/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
  plugins: [
    'stylelint-value-no-unknown-custom-properties',
    'stylelint-declaration-block-no-ignored-properties',
    'stylelint-high-performance-animation',
    'stylelint-plugin-use-baseline',
    'stylelint-declaration-strict-value',
  ],
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

    // --- Plugin rules ---

    // Cross-file CSS variable validation (resolves vars defined in base.css)
    'csstools/value-no-unknown-custom-properties': [
      true,
      {
        importFrom: ['packages/website/src/styles/base.css'],
      },
    ],
    // Flag property combinations where one is silently ignored (e.g. width on inline)
    'plugin/declaration-block-no-ignored-properties': true,
    // Warn on animations/transitions of layout-triggering properties
    'plugin/no-low-performance-animation-properties': [
      true,
      {
        ignoreProperties: [
          'color',
          'background',
          'background-color',
          'border-color',
          'box-shadow',
          'outline-color',
          // Progress bar fills — acceptable layout transition
          'width',
        ],
      },
    ],
    // Warn on CSS features not in Baseline (widely available across browsers)
    'plugin/use-baseline': [
      true,
      {
        available: 'widely',
        ignoreProperties: {
          // Progressive enhancement — has -webkit-scrollbar fallback
          'scrollbar-width': ['/^.+$/'],
          'scrollbar-color': ['/^.+$/'],
          // Widely supported in practice; standard <textarea> behavior
          resize: ['/^.+$/'],
          // Needed for gradient text; has -webkit- fallback
          'background-clip': ['text'],
        },
      },
    ],
    // Enforce CSS variables for colors (prevents hardcoded values drifting from theme)
    'scale-unlimited/declaration-strict-value': [
      ['color', 'background-color', 'border-color'],
      {
        ignoreValues: [
          'transparent',
          'inherit',
          'currentColor',
          'none',
          'initial',
          'unset',
          // Allow white/black in specific contexts (popup, buttons)
          'white',
          '#ffffff',
        ],
      },
    ],
  },
};
