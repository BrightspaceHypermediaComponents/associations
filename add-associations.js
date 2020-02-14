import '@brightspace-ui/core/components/button/button';
import '@brightspace-ui/core/components/icons/icon';
import '@brightspace-ui/core/components/list/list';
import '@brightspace-ui/core/components/list/list-item';
import '@brightspace-ui/core/components/inputs/input-search';
import 'd2l-alert/d2l-alert';
import 'd2l-loading-spinner/d2l-loading-spinner';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import getType from './types/getType';
import { HmInterface } from './hm-interface.js';
import { langResources } from './lang';
import { LocalizeMixin } from '@brightspace-ui/core/mixins/localize-mixin.js';

class AssociationList extends LocalizeMixin(LitElement) {

	static get properties() {
		return {
			href: { type: String, attribute: 'href' },
			potentialAssociations: { type: String },
			_state: { type: Object },
			token: { type: String },
			type: { type: String },
			_textFilter: { type: String }
		};
	}

	static get styles() {
		return css`
			:host([hidden]) {
				display: none;
			}

			d2l-list {
				margin-bottom: 2rem;
			}

			.spacer {
				width: 0.25rem;
				display: inline-block;
			}

			.truncated {
				overflow: hidden;
				text-overflow: ellipsis;
				word-break: break-all;
				word-wrap: break-word;
				white-space: nowrap;
			}

			.bottom { padding: 0.25rem; }

			.add-associations-top {
				display: flex;
				padding-bottom: 1.5rem;
			}

			.add-associations-description,
			d2l-input-search {
				flex: 1;
			}

			.spinner-container {
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			:host {
				position: relative;
			}

			.add-associations-list-text {
				height: 100%;
				display: flex;
			}

			.add-associations-list-text-inner,
			.add-associations-list-action {
				margin-top: auto;
				margin-bottom: auto;
			}

			.add-associations-spacer {
				display: inline-block;
				width: 1rem;
			}
		`;
	}

	static async getLocalizeResources(langs) {
		for (let i = 0; i < langs.length; i++) {
			if (langResources[langs[i]]) {
				return {
					language: langs[i],
					resources: langResources[langs[i]]
				};
			}
		}

		return null;
	}

	get associationType() {
		return getType(this.type);
	}

	connectedCallback() {
		super.connectedCallback();
	}

	reset() {
		if (this.hmInterface && !this.hmInterface.stopped) {
			this.hmInterface.stop();
		}

		this.hmInterface = new HmInterface({
			href: this.href,
			type: this.associationType,
			token: this.token
		});

		const search = this.shadowRoot.querySelector('d2l-input-search');
		if (search) {
			search.value = '';
		}
		this._textFilter = '';
		this.loadStuffThenDoStuff();
	}

	async loadStuffThenDoStuff() {
		this.setState(this.states.loading);
		await this.hmInterface.setupPromise;
		this.setState(this.states.selecting);
		if (this.hmInterface.errored) {
			this.setState(this.states.error);
		}
		this.potentialAssociations = this.hmInterface.augmentedPotentialAssociations;
	}

	get states() {
		return {
			loading: {
				render: this.renderLoading.bind(this),
			},
			selecting: {
				render: this.renderSelecting.bind(this),
			},
			submitting: {
				render: this.renderSubmitting.bind(this),
			},
			error: {
				render: this.renderError.bind(this),
			},
			errorAdding: {
				render: this.renderErrorAdding.bind(this),
			}
		};
	}

	setState(state) {
		this._state = state;
		setTimeout(() => {
			this.dispatchEvent(new CustomEvent('associations-resize-dialog', { bubbles: true, composed: true }));
		}, 10);
	}

	async _selectClicked() {
		this.setState(this.states.submitting);

		const selectedAssociations = this.shadowRoot.querySelector('d2l-list').getSelectionInfo().keys;
		const associations = this.potentialAssociations
			.filter(x => selectedAssociations.indexOf(x.item.getLinkByRel('self').href) > -1)
			.map(x => x.association);
		const associationPromises = associations.map(x => this.hmInterface.setActivityUsageItemAssociations(x));
		await Promise.all(associationPromises).catch(() => this.setState(this.states.errorAdding));
		this._sendAssociationsAddedEvent();
		this._clearAndClose();
	}

	_cancelClicked() {
		this._clearAndClose();
	}

	_clearAndClose() {
		this._sendDoneWorkEvent();
	}

	_sendDoneWorkEvent() {
		this.dispatchEvent(new CustomEvent('associations-done-work', { bubbles: true, composed: true }));
	}

	_sendAssociationsAddedEvent() {
		this.dispatchEvent(new CustomEvent('associations-added', { bubbles: true, composed: true }));
	}

	_renderListItem(text, previewHref, href) {
		return html`
			<d2l-list-item selectable key="${href}">
				<div class="add-associations-list-text">
					<div class="add-associations-list-text-inner">
						${text}
					</div>
				</div>
				<div class="add-associations-list-action" slot="actions">
					<a href="${previewHref}" target="_blank" aria-label="${this.localize('preview')}">
						<d2l-icon icon="tier1:preview"></d2l-icon>
					</a>
				</div>
			</d2l-list-item>
		`;
	}

	_renderListItems() {
		const list = this.potentialAssociations || [];
		const filteredList = this._textFilter ?
			list.filter(({ item }) => item.properties.name.toLowerCase().includes(this._textFilter)) :
			list;

		return filteredList.map(({ item }) => html`${
			this._renderListItem(item.properties.name, item.getLinkByClass('preview').href, item.getLinkByRel('self').href)
		}`);
	}

	renderSpinner() {
		return html`<div class="spinner-container"><d2l-loading-spinner size="100"></d2l-loading-spinner></div>`;
	}

	renderSubmitting() {
		return this.renderSpinner();
	}

	renderLoading() {
		return this.renderSpinner();
	}

	renderError() {
		return html`<d2l-alert type="error">${this.localize('errorFetchingList')}</d2l-alert>`;
	}

	renderErrorAdding() {
		return html`<d2l-alert type="error">${this.localize('errorAddingAssociations')}</d2l-alert>`;
	}

	_searchMade(e) {
		this._textFilter = (e.detail.value || '').toLowerCase();
	}

	renderSelecting() {
		return html`
			<div class="add-associations-top">
				<div class="add-associations-description">${this.localize(getType(this.type).addDescription)}</div>
				<div class="add-associations-spacer"></div>
				<d2l-input-search
					label="${this.localize('search')}"
					placeholder="${this.localize('search')}"
					@d2l-input-search-searched="${this._searchMade}"
				>
				</d2l-input-search>
			</div>
			<d2l-list>
				${this._renderListItems()}
			</d2l-list>
			<d2l-button slot="footer" primary @click="${this._selectClicked}">${this.localize('addSelected')}</d2l-button>
			<d2l-button slot="footer" @click="${this._cancelClicked}">${this.localize('cancel')}</d2l-button>
			<div class="bottom"></div>
		`;
	}

	render() {
		return this._state ? this._state.render() : html``;
	}
}
customElements.define('d2l-add-associations', AssociationList);
