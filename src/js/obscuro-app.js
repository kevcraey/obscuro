import {BaseHTMLElement, defineWebComponent, registerWebComponents} from '@domg-wc/common';
import {VlTemplate} from '@domg-wc/components/block/template/vl-template.component.js';
import {VlContentHeaderComponent} from '@domg-wc/components/block/content-header/vl-content-header.component.js';
import {VlTabsComponent} from '@domg-wc/components/block/tabs/vl-tabs.component.js';
import {VlTabsPaneComponent} from '@domg-wc/components/block/tabs/vl-tabs-pane.component.js';
import {VlButtonComponent} from '@domg-wc/components/atom/button/vl-button.component.js';
import {VlAlert} from '@domg-wc/components/block/alert/vl-alert.component.js';
import {vlGlobalStyles} from '@domg-wc/styles';

registerWebComponents([
  VlTemplate,
  VlContentHeaderComponent,
  VlTabsComponent,
  VlTabsPaneComponent,
  VlButtonComponent,
  VlAlert,
]);

export class ObscuroApp extends BaseHTMLElement {
  constructor() {
    super(`
      <style>
        ${vlGlobalStyles}
        .input-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-top: 1.5rem;
        }
        .result-block {
          padding: 1rem;
          background: #f5f5f5;
          border-left: 4px solid #0055cc;
          white-space: pre-wrap;
          font-family: inherit;
          word-break: break-word;
        }
        .mapping-id-block {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #666;
        }
        .action-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .spinner {
          display: none;
          width: 20px;
          height: 20px;
          border: 3px solid #ccc;
          border-top-color: #0055cc;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        .spinner.active {
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <vl-template>
        <div slot="main">
          <vl-content-header>
            <img slot="image" sizes="100vw" src="/img/banner.png" alt="" />
            <a slot="context-link" href="/">OBSCURO</a>
            <a slot="title-link" href="/">Jouw priv-AI-cy assistent</a>
          </vl-content-header>
          <section class="vl-region">
            <div class="vl-layout">
              <div class="vl-grid">
                <div class="vl-column vl-column--2 vl-column--1--s"></div>
                <div class="vl-column vl-column--8 vl-column--10--s vl-column--12--xs">

                  <vl-tabs active-tab="pseudo" disable-links>

                    <vl-tabs-pane id="pseudo" title="Pseudonimiseren">
                      <div class="input-area">
                        <textarea id="pseudo-input" class="vl-textarea vl-textarea--block" rows="10" placeholder="Voer hier de tekst in om te pseudonimiseren..."></textarea>
                        <div class="action-row">
                          <vl-button id="pseudo-btn">Pseudonimiseer</vl-button>
                          <div class="spinner" id="pseudo-spinner"></div>
                        </div>
                        <div id="pseudo-error" style="display:none;"></div>
                        <div id="pseudo-result-container" style="display:none;">
                          <div class="result-block" id="pseudo-result"></div>
                          <div class="mapping-id-block">Mapping ID: <code id="pseudo-mapping-id"></code></div>
                        </div>
                      </div>
                    </vl-tabs-pane>

                    <vl-tabs-pane id="depseudo" title="De-pseudonimiseren">
                      <div class="input-area">
                        <textarea id="depseudo-input" class="vl-textarea vl-textarea--block" rows="10" placeholder="Voer hier de gepseudonimiseerde tekst in..."></textarea>
                        <div>
                          <label for="mapping-id-input" class="vl-form__label">Mapping ID</label>
                          <input id="mapping-id-input" class="vl-input-field vl-input-field--block" type="text" placeholder="Voer het mapping ID in..." />
                        </div>
                        <div class="action-row">
                          <vl-button id="depseudo-btn">De-pseudonimiseer</vl-button>
                          <div class="spinner" id="depseudo-spinner"></div>
                        </div>
                        <div id="depseudo-error" style="display:none;"></div>
                        <div id="depseudo-result-container" style="display:none;">
                          <div class="result-block" id="depseudo-result"></div>
                        </div>
                      </div>
                    </vl-tabs-pane>

                  </vl-tabs>

                </div>
                <div class="vl-column vl-column--2 vl-column--1--s"></div>
              </div>
            </div>
          </section>
        </div>
      </vl-template>
    `);
    this.__addVlElementStyleSheetsToDocument();
  }

  __addVlElementStyleSheetsToDocument() {
    document.adoptedStyleSheets = [
      ...vlGlobalStyles.map((style) => style.styleSheet),
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.querySelector('#pseudo-btn').addEventListener('vl-click', () => this._doPseudo());
    this.shadowRoot.querySelector('#depseudo-btn').addEventListener('vl-click', () => this._doDepseudo());
    ['#pseudo-input', '#depseudo-input', '#mapping-id-input'].forEach((id) => {
      this.shadowRoot.querySelector(id).addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') e.stopPropagation();
      });
    });
  }

  async _doPseudo() {
    const text = this.shadowRoot.querySelector('#pseudo-input').value;
    if (!text?.trim()) return;

    const spinner = this.shadowRoot.querySelector('#pseudo-spinner');
    const errorEl = this.shadowRoot.querySelector('#pseudo-error');
    const resultContainer = this.shadowRoot.querySelector('#pseudo-result-container');

    spinner.classList.add('active');
    errorEl.style.display = 'none';
    resultContainer.style.display = 'none';

    try {
      const response = await fetch('/api/pseudonymize', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text}),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({detail: response.statusText}));
        throw new Error(err.detail || 'Onbekende fout');
      }

      const data = await response.json();
      this.shadowRoot.querySelector('#pseudo-result').textContent = data.text;
      this.shadowRoot.querySelector('#pseudo-mapping-id').textContent = data.mapping_id;
      resultContainer.style.display = 'block';
    } catch (e) {
      errorEl.innerHTML = `<vl-alert data-vl-type="error" data-vl-title="Fout">${e.message}</vl-alert>`;
      errorEl.style.display = 'block';
    } finally {
      spinner.classList.remove('active');
    }
  }

  async _doDepseudo() {
    const text = this.shadowRoot.querySelector('#depseudo-input').value;
    const mappingId = this.shadowRoot.querySelector('#mapping-id-input').value;

    if (!text?.trim() || !mappingId?.trim()) return;

    const spinner = this.shadowRoot.querySelector('#depseudo-spinner');
    const errorEl = this.shadowRoot.querySelector('#depseudo-error');
    const resultContainer = this.shadowRoot.querySelector('#depseudo-result-container');

    spinner.classList.add('active');
    errorEl.style.display = 'none';
    resultContainer.style.display = 'none';

    try {
      const response = await fetch('/api/depseudonymize', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text, mapping_id: mappingId}),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({detail: response.statusText}));
        throw new Error(err.detail || 'Onbekende fout');
      }

      const data = await response.json();
      this.shadowRoot.querySelector('#depseudo-result').textContent = data.text;
      resultContainer.style.display = 'block';
    } catch (e) {
      errorEl.innerHTML = `<vl-alert data-vl-type="error" data-vl-title="Fout">${e.message}</vl-alert>`;
      errorEl.style.display = 'block';
    } finally {
      spinner.classList.remove('active');
    }
  }
}

defineWebComponent(ObscuroApp, 'obscuro-app');
