import { css } from "lit";

/** Farben greifen auf HA-Theme-Variablen zurück und haben eigene Standardwerte für die Web-App. */
export const baseStyles = css`
  :host {
    --pd-primary: var(--pd-accent, var(--primary-color, #b8432f));
    --pd-on-primary: var(--text-primary-color, #fff);
    --pd-text: var(--primary-text-color, #1d1b19);
    --pd-muted: var(--secondary-text-color, #6b6560);
    --pd-bg: var(--card-background-color, var(--ha-card-background, #fff));
    --pd-surface: var(--secondary-background-color, #f5f1ec);
    --pd-border: var(--divider-color, #e3ddd6);
    --pd-warn: var(--warning-color, #b26a00);
    --pd-ok: var(--success-color, #2e7d32);
    --pd-radius: 10px;
    display: block;
    color: var(--pd-text);
    font-family: var(--paper-font-body1_-_font-family, inherit);
    font-size: 14px;
    line-height: 1.4;
  }
  * { box-sizing: border-box; }
  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--pd-muted); margin: 18px 0 8px; font-weight: 600; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--pd-muted); min-width: 0; }
  input, select {
    font: inherit; font-size: 15px; color: var(--pd-text); background: var(--pd-surface);
    border: 1px solid var(--pd-border); border-radius: 8px; padding: 8px 10px; width: 100%; min-width: 0;
  }
  input:focus, select:focus { outline: 2px solid var(--pd-primary); outline-offset: -1px; }
  button {
    font: inherit; font-weight: 600; cursor: pointer; border-radius: 8px; padding: 9px 14px;
    border: 1px solid var(--pd-border); background: var(--pd-surface); color: var(--pd-text);
  }
  button.primary { background: var(--pd-primary); border-color: var(--pd-primary); color: var(--pd-on-primary); }
  button.ghost { background: transparent; border-color: transparent; color: var(--pd-primary); padding: 6px 8px; }
  button:disabled { opacity: .5; cursor: default; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .muted { color: var(--pd-muted); font-size: 12px; }
  .warn { color: var(--pd-warn); font-size: 13px; margin: 6px 0; display: flex; gap: 6px; }
  .num { font-variant-numeric: tabular-nums; }
`;
