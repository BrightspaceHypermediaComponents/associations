function getAssociations(transientAdd = null, transientRemove = null) {
	return {
		'class': [
			'associations'
		],
		'entities': [
			{
				'class': [
					'single-association'
				],
				'rel': [
					'item'
				],
				'entities': [
					{
						'class': [
							'activity-usage'
						],
						'rel': [
							'item',
							'https://rubrics.api.brightspace.com/rels/associated-activity'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060'
					}
				],
				'actions': [{
					'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations/3',
					'name': 'delete-association',
					'method': 'DELETE'
				}, {
					'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations',
					'name': 'delete-deferred-association',
					'method': 'POST',
					'fields': [
						{
							'name': 'transientAdditions',
							'type': 'hidden',
							'value': ''
						},
						{
							'name': 'transientDeletions',
							'type': 'hidden',
							'value': ['13-rubrics'].concat(transientRemove ? [transientRemove] : []).join(',')
						},
						{
							'name': 'save',
							'type': 'hidden',
							'value': false
						}
					]
				}],
				'links': [
					{
						'rel': [
							'self'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.rubrics.api.dev.brightspace.com/organizations/123060/13/associations/3'
					},
					{
						'rel': [
							'https://rubrics.api.brightspace.com/rels/rubric',
							'up'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.rubrics.api.dev.brightspace.com/organizations/123060/13'
					}
				]
			},
			{
				'class': [
					'potential-association'
				],
				'rel': [
					'item'
				],
				'entities': [
					{
						'class': [
							'activity-usage'
						],
						'rel': [
							'item',
							'https://rubrics.api.brightspace.com/rels/associated-activity'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060'
					}
				],
				'actions': [{
					'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations',
					'name': 'create-association',
					'method': 'POST',
					'fields': [
						{
							'name': 'itemId',
							'value': '17'
						},
						{
							'name': 'type',
							'value': 'rubrics'
						}
					]
				}, {
					'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations',
					'name': 'create-deferred-association',
					'method': 'POST',
					'fields': [
						{
							'name': 'transientAdditions',
							'type': 'hidden',
							'value': ['17-rubrics'].concat(transientAdd ? [transientAdd] : []).join(',')
						},
						{
							'name': 'transientDeletions',
							'type': 'hidden',
							'value': ''
						},
						{
							'name': 'save',
							'type': 'hidden',
							'value': false
						}
					]
				}],
				'links': [
					{
						'rel': [
							'https://rubrics.api.brightspace.com/rels/rubric',
							'up'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.rubrics.api.dev.brightspace.com/organizations/123060/17'
					}
				]
			},
			{
				'class': [
					'potential-association'
				],
				'rel': [
					'item'
				],
				'entities': [
					{
						'class': [
							'activity-usage'
						],
						'rel': [
							'item',
							'https://rubrics.api.brightspace.com/rels/associated-activity'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060'
					}
				],
				'actions': [{
					'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations',
					'name': 'create-association',
					'method': 'POST',
					'fields': [
						{
							'name': 'itemId',
							'value': '18'
						},
						{
							'name': 'type',
							'value': 'rubrics'
						}
					]
				}, {
					'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations',
					'name': 'create-deferred-association',
					'method': 'POST',
					'fields': [
						{
							'name': 'transientAdditions',
							'type': 'hidden',
							'value': ['18-rubrics'].concat(transientAdd ? [transientAdd] : []).join(',')
						},
						{
							'name': 'transientDeletions',
							'type': 'hidden',
							'value': ''
						},
						{
							'name': 'save',
							'type': 'hidden',
							'value': false
						}
					]
				}],
				'links': [
					{
						'rel': [
							'https://rubrics.api.brightspace.com/rels/rubric',
							'up'
						],
						'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.rubrics.api.dev.brightspace.com/organizations/123060/18'
					}
				]
			},
		],
		'links': [
			{
				'rel': [
					'self'
				],
				'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations'
			},
			{
				'rel': [
					'up'
				],
				'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060'
			}
		],
		'actions': [{
			'class': [
				'create'
			],
			'title': 'Create Association',
			'href': 'https://99d6c88f-3f9e-45e6-b804-988b1f68e463.activities.api.dev.brightspace.com/activities/6606_703000_8d6566eb-6f69-4a73-b08d-e787f9f4b87b/usages/123060/associations',
			'name': 'create-association',
			'method': 'POST',
			'fields': [
				{
					'name': 'itemId'
				},
				{
					'name': 'type',
					'value': 'rubrics'
				}
			]
		}]
	};
}

window.getNewAssociations = getAssociations;
