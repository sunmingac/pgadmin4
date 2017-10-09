define('pgadmin.node.fts_parser', [
  'sources/gettext', 'sources/url_for', 'underscore', 'pgadmin.browser',
  'pgadmin.browser.collection',
], function(gettext, url_for, _, pgBrowser) {

  // Extend the collection class for fts parser
  if (!pgBrowser.Nodes['coll-fts_parser']) {
    pgBrowser.Nodes['coll-fts_parser'] =
      pgBrowser.Collection.extend({
        node: 'fts_parser', label: gettext('FTS Parsers'),
        type: 'coll-fts_parser', columns: ['name', 'description'],
      });
  }

  // Extend the node class for fts parser
  if (!pgBrowser.Nodes.fts_parser) {
    pgBrowser.Nodes.fts_parser = pgBrowser.Node.extend({
      parent_type: ['schema', 'catalog'],
      type: 'fts_parser',
      sqlAlterHelp: 'sql-altertsparser.html',
      sqlCreateHelp: 'sql-createtsparser.html',
      dialogHelp: url_for('help.static', {'filename': 'fts_parser_dialog.html'}),
      canDrop: true,
      canDropCascade: true,
      label: gettext('FTS Parser'),
      hasSQL: true,
      hasDepends: true,
      Init: function() {

        // Avoid multiple registration of menus
        if (this.initialized)
          return;

        this.initialized = true;

        // Add context menus for fts parser
        pgBrowser.add_menus([{
          name: 'create_fts_parser_on_schema', node: 'schema', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('FTS Parser...'),
          icon: 'wcTabIcon icon-fts_parser', data: {action: 'create'},
          enable: 'canCreate',
        },{
          name: 'create_fts_parser_on_coll', node: 'coll-fts_parser',
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('FTS Parser...'),
          icon: 'wcTabIcon icon-fts_parser', data: {action: 'create'},
          module: this, enable: 'canCreate',
        },{
          name: 'create_fts_parser', node: 'fts_parser', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('FTS Parser...'),
          icon: 'wcTabIcon icon-fts_parser', data: {action: 'create'},
          enable: 'canCreate',
        }]);

      },

      // Defining backform model for fts parser node
      model: pgBrowser.Node.Model.extend({
        defaults: {
          name: undefined,          // Fts parser name
          description: undefined,   // Comment on parser
          schema: undefined,        // Schema name to which parser belongs
          prsstart: undefined,      // Start function for fts parser
          prstoken: undefined,       // Token function for fts parser
          prsend: undefined,        // End function for fts parser
          prslextype: undefined,    // Lextype function for fts parser
          prsheadline: undefined,    // Headline function for fts parse
        },
        initialize: function(attrs, args) {
          pgBrowser.Node.Model.prototype.initialize.apply(this, arguments);

          // If it new model, then - set the default schema.
          if (_.size(attrs) === 0) {
            this.set('schema', args.node_info.schema._id);
          }
        },
        // Defining schema for fts parser
        schema: [{
          id: 'name', label: gettext('Name'), cell: 'string',
          type: 'text', cellHeaderClasses: 'width_percent_50',
        },{
          id: 'oid', label: gettext('OID'), cell: 'string',
          editable: false, type: 'text', disabled: true, mode:['properties'],
        },{
          id: 'schema', label: gettext('Schema'), cell: 'string',
          type: 'text', mode: ['create','edit'], node: 'schema',
          control: 'node-list-by-id', cache_node: 'database',
          cache_level: 'database',
        },{
          id: 'description', label: gettext('Comment'), cell: 'string',
          type: 'multiline', cellHeaderClasses: 'width_percent_50',
        },{
          id: 'prsstart', label: gettext('Start function'),
          type: 'text', disabled: function(m) { return !m.isNew(); },
          control: 'node-ajax-options', url: 'start_functions',
          group: gettext('Definition'), cache_level: 'database',
          cache_node: 'schema',
        },{
          id: 'prstoken', label: gettext('Get next token function'),
          type: 'text', disabled: function(m) { return !m.isNew(); },
          control: 'node-ajax-options', url: 'token_functions',
          group: gettext('Definition'), cache_level: 'database',
          cache_node: 'schema',
        },{
          id: 'prsend', label: gettext('End function'),
          type: 'text', disabled: function(m) { return !m.isNew(); },
          control: 'node-ajax-options', url: 'end_functions',
          group: gettext('Definition'), cache_level: 'database',
          cache_node: 'schema',
        },{
          id: 'prslextype', label: gettext('Lextypes function'),
          type: 'text', disabled: function(m) { return !m.isNew(); },
          control: 'node-ajax-options', url: 'lextype_functions',
          group: gettext('Definition'), cache_level: 'database',
          cache_node: 'schema',
        },{
          id: 'prsheadline', label: gettext('Headline function'),
          type: 'text', disabled: function(m) { return !m.isNew(); },
          control: 'node-ajax-options', url: 'headline_functions',
          group: gettext('Definition'), cache_level: 'database',
          cache_node: 'schema',
        }],

        /*
         * Triggers control specific error messages for parser name, start,
         * token, end, lextype functions and schema, if any one of them is not
         * specified while creating new fts parser.
         */
        validate: function() {
          var name = this.get('name'),
            start = this.get('prsstart'),
            token = this.get('prstoken'),
            end = this.get('prsend'),
            lextype = this.get('prslextype'),
            schema = this.get('schema'),
            msg, isEmpty = function(val) {
              return _.isUndefined(val) || _.isNull(val) ||
                String(val).replace(/^\s+|\s+$/g, '') === '';
            };

          // Validate fts parser name
          if (isEmpty(name)) {
            msg = gettext('Name must be specified.');
            this.errorModel.set('name', msg);
            return msg;
          } else if (isEmpty(start)) {
            // Validate start function control
            msg = gettext('Start function must be selected.');
            this.errorModel.set('prsstart', msg);
            return msg;
          } else if (isEmpty(token)) {
            // Validate gettoken function control
            msg = gettext('Get next token function must be selected.');
            this.errorModel.set('prstoken', msg);
            return msg;
          } else if (isEmpty(end)) {
            // Validate end function control
            msg = gettext('End function must be selected.');
            this.errorModel.set('prsend', msg);
            return msg;
          } else if (isEmpty(lextype)) {
            // Validate lextype function control
            msg = gettext('Lextype function must be selected.');
            this.errorModel.set('prslextype', msg);
            return msg;
          } else if (isEmpty(schema)) {
            msg = gettext('Schema must be selected.');
            this.errorModel.set('schema', msg);
            return msg;
          } else {
            this.errorModel.clear();
          }

          this.trigger('on-status-clear');
          return null;
        },
      }),
      canCreate: function(itemData, item, data) {
        //If check is false then , we will allow create menu
        if (data && data.check == false)
          return true;

        var t = pgBrowser.tree, i = item, d = itemData;
        // To iterate over tree to check parent node
        while (i) {
          // If it is schema then allow user to create fts parser
          if (_.indexOf(['schema'], d._type) > -1)
            return true;

          if ('coll-fts_parser' == d._type) {
            //Check if we are not child of catalog
            var prev_i = t.hasParent(i) ? t.parent(i) : null,
              prev_d = prev_i ? t.itemData(prev_i) : null;
            if( prev_d._type == 'catalog') {
              return false;
            } else {
              return true;
            }
          }
          i = t.hasParent(i) ? t.parent(i) : null;
          d = i ? t.itemData(i) : null;
        }
        // by default we do not want to allow create menu
        return true;
      },
    });
  }

  return pgBrowser.Nodes.fts_parser;
});
