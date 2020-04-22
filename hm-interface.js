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

	async setActivityUsageItemAssociations(associationEntity) {
		const createAssociationAction = associationEntity.getActionByName('create-association');
		const searchParams = this.getActionBody(createAssociationAction);
		const updated = await this.makeCall(createAssociationAction.href, { method: createAssociationAction.method, body: searchParams, contentType: 'application/x-www-form-urlencoded' });

		window.D2L.Siren.EntityStore.update(this.associationsHref, await this.getToken(), updated);
		return updated;
	}

	async toggleAssociation(associationEntity) {
		await this.requestPromise;
		let resolveRequestPromise;
		this.requestPromise = new Promise((resolve) => resolveRequestPromise = resolve);
		try {
			const action = associationEntity.getActionByName('create-association') || associationEntity.getActionByName('delete-association');
			const searchParams = this.getActionBody(action);
			const updated = await this.makeCall(action.href, { method: action.method, body: searchParams, contentType: 'application/x-www-form-urlencoded' });

			window.D2L.Siren.EntityStore.update(this.associationsHref, await this.getToken(), updated);
			this.associations = updated;
			this.potentialAssociations = this.associations.getSubEntitiesByClass(Classes.activities.potentialAssociation);
			const augmentedPotentialAssociations = this.potentialAssociations.map(this.fetchItemForPotentialAssociation, this);
			this.augmentedPotentialAssociations = await Promise.all(augmentedPotentialAssociations);
			return updated;
		} finally {
			this.requestPromise = null;
			resolveRequestPromise();
		}
	}

	async apply() {
		await this.requestPromise;
		let resolveRequestPromise;
		this.requestPromise = new Promise((resolve) => resolveRequestPromise = resolve);
		try {
			const action = this.associations.getActionByName('apply-associations');
			const searchParams = this.getActionBody(action);
			const updated = await this.makeCall(action.href, { method: action.method, body: searchParams, contentType: 'application/x-www-form-urlencoded' });

			window.D2L.Siren.EntityStore.update(this.associationsHref, await this.getToken(), updated);
			return updated;
		} finally {
			this.requestPromise = null;
			resolveRequestPromise();
		}
	}

	async setup() {
		this.checkForRequiredParams();
		this.activityUsage = await this.makeCall(this.href);
		const queryAssociationsAction = this.activityUsage.getActionByName('query-associations');
		this.associationsHref = this.getQueryActionHref(queryAssociationsAction, { type: this.type.name });
		this.associations = await this.makeCall(this.associationsHref);
		if (this.associations.getActionByName('start-add-associations')) {
			const startAddAssocitionsAction = this.associations.getActionByName('start-add-associations');
			const searchParams = this.getActionBody(startAddAssocitionsAction);
			this.associations = await this.makeCall(startAddAssocitionsAction.href, { method: startAddAssocitionsAction.method, body: searchParams, contentType: 'application/x-www-form-urlencoded' });
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

	associationsHasApply() {
		return this.associations.hasActionByName('apply-associations');
	}

	getQueryActionHref(action, params) {
		let href = action.href;
		const queryStrings = [];
		action.fields.forEach(field => {
			if (params[field.name]) {
				queryStrings.push({ name: field.name, value: params[field.name] });
			}
		});
		if (queryStrings.length > 0) {
			href += `?${queryStrings.map(x => `${x.name}=${x.value}`).join('&')}`;
		}
		return href;
	}

	getActionBody(action, params = {}) {
		const searchParams = new URLSearchParams();
		action.fields.forEach(field => {
			let value = field.value;
			if (params[field.name]) {
				value = params[field.name];
			}
			if (Array.isArray(value)) {
				value.forEach(fieldValue => searchParams.append(field.name, fieldValue));
			} else if (value) {
				searchParams.append(field.name, value);
			}
		});
		return searchParams;
	}

	async getToken() {
		return (typeof this.token === 'function') ? await this.token() : this.token;
	}

	async makeCall(href, { method = 'GET', body, contentType } = {}) {
		if (this.stopped) {
			return;
		}
		if (!href) {
			throw new Error('no href provided');
		}

		let token = await this.getToken();
		if (token && token.indexOf('Bearer ') !== 0) {
			token = `Bearer ${token}`;
		}
		const headers = { Authorization: token };
		if (contentType) {
			headers['content-type'] = contentType;
		}

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
