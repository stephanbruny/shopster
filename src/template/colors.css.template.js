module.exports = (context) =>
`
[data-theme="light"],
:root:not([data-theme="dark"]) {
  --primary: #d81b60;
  --primary-hover: #c2185b;
  --primary-focus: rgba(216, 27, 96, 0.125);
  --primary-inverse: #FFF;
}

/* Pink Dark scheme (Auto) */
/* Automatically enabled if user has Dark mode enabled */
@media only screen and (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --primary: #d81b60;
    --primary-hover: #e91e63;
    --primary-focus: rgba(216, 27, 96, 0.25);
    --primary-inverse: #FFF;
  }
}

/* Pink Dark scheme (Forced) */
/* Enabled if forced with data-theme="dark" */
[data-theme="dark"] {
  --primary: #d81b60;
  --primary-hover: #e91e63;
  --primary-focus: rgba(216, 27, 96, 0.25);
  --primary-inverse: #FFF;
}

/* Pink (Common styles) */
:root {
  --form-element-active-border-color: var(--primary);
  --form-element-focus-color: var(--primary-focus);
  --switch-color: var(--primary-inverse);
  --switch-checked-background-color: var(--primary);
}
`