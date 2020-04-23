import { Classes } from 'd2l-hypermedia-constants/index';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import SirenParse from 'siren-parser';

export class HmInterface {
	constructor({
		href,
		type,
		token,
	}) {
		this.href = href;
		this.token = token;
		this.setupPromise = this.setup();
		this.stopped = false;
		this.type = type;
		this.requestPromise = null;
	}

	checkForRequiredParams() {
		if (!this.href) {
			throw new Error('no href provided');
		}
	}

	stop() {
		this.stopped = true;
	}

	/**
	 * @deprecated
	 */
	async setActivityUsageItemAssociations(associationEntity) {
		const createAssociationAction = associationEntity.getActionByName('create-association');
		const updated = await this.makeCall(createAssociationAction);

		window.D2L.Siren.EntityStore.update(this.associationsHref, await this.getToken(), updated);
		return updated;
	}

	async toggleAssociation(associationEntity) {
		// Use try/finally to avoid toggling multiple associations at once
		await this.requestPromise;
		let resolveRequestPromise;
		this.requestPromise = new Promise((resolve) => resolveRequestPromise = resolve);
		try {
			const action = associationEntity.getActionByName('create-association') || associationEntity.getActionByName('delete-association');
			const updated = await this.makeCall(action);

			window.D2L.Siren.EntityStore.update(this.associationsHref, await this.getToken(), updated);
			this.associations = updated;
			this.potentialAssociations = this.associations.getSubEntitiesByClass(Classes.activities.potentialAssociation);
			const augmentedPotentialAssociations = this.potentialAssociations.map(this.fetchItemForPotentialAssociation, this);
			this.augmentedPotentialAssociations = await Promise.all(augmentedPotentialAssociations);
			return updated;
		} finally {
			resolveRequestPromise();
		}
	}

	async apply() {
		// Use try/finally to avoid calling while associations state is being built (via toggleAssociation)
		await this.requestPromise;
		let resolveRequestPromise;
		this.requestPromise = new Promise((resolve) => resolveRequestPromise = resolve);
		try {
			const action = this.associations.getActionByName('apply-associations');
			const updated = await this.makeCall(action);

			window.D2L.Siren.EntityStore.update(this.associationsHref, await this.getToken(), updated);
			return updated;
		} finally {
			resolveRequestPromise();
		}
	}

	async setup() {
		this.checkForRequiredParams();
		this.activityUsage = await this.makeCall(this.href);
		const queryAssociationsAction = this.activityUsage.getActionByName('query-associations');
		this.associations = await this.makeCall(queryAssociationsAction, { type: this.type.name });
		if (this.associations.getActionByName('start-add-associations')) {
			const startAddAssocitionsAction = this.associations.getActionByName('start-add-associations');
			this.associations = await this.makeCall(startAddAssocitionsAction, { type: this.type.name });
		}
		this.potentialAssociations = this.associations.getSubEntitiesByClass(Classes.activities.potentialAssociation);
		const augmentedPotentialAssociations = this.potentialAssociations.map(this.fetchItemForPotentialAssociation, this);
		this.augmentedPotentialAssociations = await Promise.all(augmentedPotentialAssociations);
	}

	async fetchItemForPotentialAssociation(potentialAssociation) {
		const href = potentialAssociation.getLinkByRel(this.type.itemRel).href;
		const item = await this.makeCall(href);
		return {
			association: potentialAssociation,
			item
		};
	}

	/**
	 * TODO: Remove when setActivityUsageItemAssociations is no longer used
	 */
	associationsHasApply() {
		return this.associations.hasActionByName('apply-associations');
	}

	/**
	 * @param {Action} action - Siren action to process
	 * @param {?object} params - Object containing params to override/extend the Siren field values
	 * @returns {URLSearchParams} URLSearchParams representing the siren fields and passed parameters
	 */
	getActionSearchParams(action, params = {}) {
		const shouldIncludeQuery = action.method === undefined || action.method === 'GET' || action.method === 'HEAD';
		const searchParams = shouldIncludeQuery ? new URL(action.href).searchParams : new URLSearchParams();
		(action.fields || []).forEach(field => {
			let value = field.value;
			if (params[field.name]) {
				value = params[field.name];
				delete params[field.name];
			}
			if (Array.isArray(value)) {
				value.forEach(fieldValue => searchParams.append(field.name, fieldValue));
			} else if (value) {
				searchParams.append(field.name, value);
			}
		});
		Object.keys(params).forEach(param => {
			const value = params[param];
			if (Array.isArray(value)) {
				value.forEach(fieldValue => searchParams.append(param, fieldValue));
			} else if (value) {
				searchParams.append(param, value);
			}
		});
		return searchParams;
	}

	async getToken() {
		return (typeof this.token === 'function') ? await this.token() : this.token;
	}

	/**
	 * @param {Action|string} action - The Siren action to perform or href to fetch. Currently only supports URLSearchParams body type
	 * @param {?object} params - Object containing params to override/extend the Siren field values, or query params to send with href
	 * @param {Promise<Entity | undefined>} Siren Entity if call is successful, or undefined if HmInterface is stopped
	 */
	async makeCall(action, params = {}) {
		if (this.stopped) {
			return;
		}

		// Handle action as an href
		if (typeof action === 'string') {
			action = {
				href: action
			};
		}

		// Setup href, method, body/query params, contentType
		let body;
		let contentType;
		let href = action.href;
		const method = action.method || 'GET';
		const searchParams = this.getActionSearchParams(action, params);
		if (!href) {
			throw new Error('no href provided');
		}
		if ((method === 'GET' || method === 'HEAD') && searchParams instanceof URLSearchParams) {
			const url = new URL(href);
			url.search = searchParams.toString();
			href = url.toString();
		} else {
			body = searchParams;
			contentType = action.type || 'application/x-www-form-urlencoded';
		}

		// Prepare headers
		let token = await this.getToken();
		if (token && token.indexOf('Bearer ') !== 0) {
			token = `Bearer ${token}`;
		}
		const headers = { Authorization: token };
		if (contentType) {
			headers['content-type'] = contentType;
		}

		// Actually make the call
		const response = await d2lfetch.fetch(new Request(href, {
			method,
			body: body,
			headers
		}));
		if (!response.ok || !this.isSuccessResponse(response)) {
			throw new Error(`${href} call was not successful, status: ${response.status}, ok: ${response.ok}`);
		}
		const responseJSON = await response.json();
		const deserializedResponse = SirenParse(responseJSON);
		return deserializedResponse;
	}

	isSuccessResponse(response) {
		return Math.floor(response.status / 100) === 2;
	}
}
