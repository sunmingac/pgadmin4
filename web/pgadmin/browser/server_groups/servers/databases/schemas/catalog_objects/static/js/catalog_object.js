define('pgadmin.node.catalog_object', [
  'sources/gettext', 'pgadmin.browser', 'pgadmin.browser.collection',
], function(gettext, pgBrowser) {

  if (!pgBrowser.Nodes['coll-catalog_object']) {
    pgBrowser.Nodes['coll-catalog_object'] = pgBrowser.Collection.extend({
      node: 'catalog_object', label: gettext('Catalog Objects'),
      type: 'coll-catalog_object', columns: ['name', 'owner', 'description'],
    });
  }

  if (!pgBrowser.Nodes.catalog_object) {
    pgBrowser.Nodes.catalog_object = pgBrowser.Node.extend({
      parent_type: 'catalog',
      type: 'catalog_object',
      label: gettext('Catalog Object'),
      hasSQL:  false,
      hasScriptTypes: [],
      hasDepends: true,
      Init: function() {
        /* Avoid mulitple registration of menus */
        if (this.initialized)
          return;

        this.initialized = true;

      },
      model: pgBrowser.Node.Model.extend({
        defaults: {
          name: undefined,
          namespaceowner: undefined,
          nspacl: undefined,
          description: undefined,
        },
        schema: [{
          id: 'name', label: gettext('Name'), cell: 'string',
          type: 'text', disabled: true,
        },{
          id: 'oid', label: gettext('OID'), cell: 'string',
          type: 'text', disabled: true,
        },{
          id: 'owner', label: gettext('Owner'), cell: 'string',
          type: 'text', disabled: true,
        },{
          id: 'description', label: gettext('Comment'), cell: 'string',
          type: 'multiline' ,  disabled: true,
        },
        ],
      }),
    });

  }

  return pgBrowser.Nodes['catalog_object'];
});
