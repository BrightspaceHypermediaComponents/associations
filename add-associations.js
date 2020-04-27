import '@brightspace-ui/core/components/button/button';
import '@brightspace-ui/core/components/icons/icon';
import '@brightspace-ui/core/components/list/list';
import '@brightspace-ui/core/components/list/list-item';
import '@brightspace-ui/core/components/inputs/input-search';
import 'd2l-alert/d2l-alert';
import 'd2l-loading-spinner/d2l-loading-spinner';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import getType from './types/getType';
import { langResources } from './lang';
import { AsyncContainerMixin, asyncStates } from '@brightspace-ui/core/mixins/async-container/async-container-mixin.js';
import { LocalizeMixin } from '@brightspace-ui/core/mixins/localize-mixin.js';
import { EntityMixinLit } from 'siren-sdk/src/mixin/entity-mixin-lit.js';
import { ActivityUsageEntity } from 'siren-sdk/src/activities/ActivityUsageEntity.js';
import { AssociationCollectionEntity } from 'siren-sdk/src/activities/Associations.js';
import { AssociationEntity } from 'siren-sdk/src/activities/Association.js';
import { entityFactory } from 'siren-sdk/src/es6/EntityFactory.js';
import { SimpleEntity } from 'siren-sdk/src/es6/SimpleEntity.js';

class AssociationList extends LocalizeMixin(AsyncContainerMixin(EntityMixinLit(LitElement))) {

	static get properties() {
		return {
			href: { type: String, attribute: 'href' },
			associations: { type: Object },
			potentialAssociations: { type: String },
			_state: { type: Object },
			token: { type: String },
			type: { type: String },
			_textFilter: { type: String },
			skipSave: { type: Boolean }
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

	constructor() {
		super();
		this._setEntityType(ActivityUsageEntity);
	}

	connectedCallback() {
		super.connectedCallback();
	}

	reset() {
		this.setState(this.states.loading);
		this.asyncState = asyncStates.initial;
		window.D2L.Siren.EntityStore.remove(this._entity.getAssociationsHref(this.type), this.token);
		this._getEntity();

		const search = this.shadowRoot.querySelector('d2l-input-search');
		if (search) {
			search.value = '';
		}
		this._textFilter = '';
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
		if (!this.skipSave) {
			const associationPromises = associations.map(x => x.createAssociation());
			await Promise.all(associationPromises).catch(() => this.setState(this.states.errorAdding));
		}
		this._sendAssociationsAddedEvent();
		this._clearAndClose(associations);
	}

	_cancelClicked() {
		this._clearAndClose();
	}

	_clearAndClose(associations) {
		this._sendDoneWorkEvent(associations);
	}

	_sendDoneWorkEvent(associations) {
		this.dispatchEvent(new CustomEvent(
			'associations-done-work',
			{
				bubbles: true,
				composed: true,
				detail: {associations}
			}
		));
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

	updated(changedProperties) {
		if (changedProperties.has('asyncState') && this.asyncState === asyncStates.complete) {
			if (this._entity) {
				this._entity.getAssociations(this.type, (entity, err) => {
					if (err) {
						this.setState(this.states.error);
						return;
					}
					this.associations = entity;
				});
			} else {
				this.setState(this.states.error);
			}
		}
		if (changedProperties.has('associations') && this.associations) {
			const potentialAssociationsEntities = this.associations.getPotentialAssociations();
			const potentialAssociations = new Array(potentialAssociationsEntities.length);
			let updated = 0;
			potentialAssociationsEntities
				.map(association => new AssociationEntity(association, this.token))
				.map((association, index) => association.getItem((item, err) => {
					if (err) {
						this.setState(this.states.error);
						return;
					}
					if (!item) {
						return;
					}
					potentialAssociations[index] = {
						association,
						item: item._entity,
					};
					++updated;

					if (updated === potentialAssociationsEntities.length) {
						this.potentialAssociations = potentialAssociations;
						this.setState(this.states.selecting);
					}
				}));
		}
	}

	render() {
		return this._state ? this._state.render() : html``;
	}
}
customElements.define('d2l-add-associations', AssociationList);
