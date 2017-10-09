/* Create and Register Procedure Collection and Node. */
define('pgadmin.node.procedure', [
  'sources/gettext', 'sources/url_for', 'underscore', 'pgadmin.browser',
  'pgadmin.node.function', 'pgadmin.browser.collection',
  'pgadmin.browser.server.privilege',
], function(gettext, url_for, _, pgBrowser, Function) {

  if (!pgBrowser.Nodes['coll-procedure']) {
    pgBrowser.Nodes['coll-procedure'] = pgBrowser.Collection.extend({
      node: 'procedure', label: gettext('Procedures'), type: 'coll-procedure',
      columns: ['name', 'funcowner', 'description'], hasStatistics: true,
    });
  }

  var pgSchemaNode = pgBrowser.Nodes['schema'];

  // Inherit Functions Node
  if (!pgBrowser.Nodes.procedure) {
    pgBrowser.Nodes.procedure = pgBrowser.Node.extend({
      type: 'procedure',
      sqlAlterHelp: 'sql-alterprocedure.html',
      sqlCreateHelp: 'sql-createprocedure.html',
      dialogHelp: url_for('help.static', {'filename': 'procedure_dialog.html'}),
      label: gettext('Procedure'),
      collection_type: 'coll-procedure',
      hasSQL: true,
      hasDepends: true,
      hasStatistics: true,
      hasScriptTypes: ['create', 'exec'],
      parent_type: ['schema', 'catalog'],
      Init: function() {
        /* Avoid mulitple registration of menus */
        if (this.proc_initialized)
          return;

        this.proc_initialized = true;

        pgBrowser.add_menus([{
          name: 'create_procedure_on_coll', node: 'coll-procedure', module:
          this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('Procedure...'),
          icon: 'wcTabIcon icon-procedure', data: {action: 'create', check:
          false}, enable: 'canCreateProc',
        },{
          name: 'create_procedure', node: 'procedure', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('Procedure...'),
          icon: 'wcTabIcon icon-procedure', data: {action: 'create', check:
          true}, enable: 'canCreateProc',
        },{
          name: 'create_procedure', node: 'schema', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('Procedure...'),
          icon: 'wcTabIcon icon-procedure', data: {action: 'create', check:
          true}, enable: 'canCreateProc',
        },
        ]);
      },
      canDrop: pgSchemaNode.canChildDrop,
      canDropCascade: false,
      canCreateProc: function(itemData, item) {
        var node_hierarchy = this.getTreeNodeHierarchy.apply(this, [item]);

        // Do not provide Create option in catalog
        if ('catalog' in node_hierarchy)
          return false;

        // Procedures supported only in PPAS
        if ('server' in node_hierarchy && node_hierarchy['server'].server_type == 'ppas')
          return true;

        return false;
      },
      model: Function.model.extend({
        defaults: _.extend(
          {}, Function.model.prototype.defaults, {lanname: 'edbspl'}
        ),
        canVarAdd: function() {
          return this.node_info.server >= 90500;
        },
        isVisible: function() {
          if (this.name == 'sysfunc') { return false; }
          else if (this.name == 'sysproc') { return true; }
          return false;
        },
        isDisabled: function(m) {
          if(this.node_info &&  'catalog' in this.node_info) {
            return true;
          }
          switch(this.name){
          case 'provolatility':
          case 'proisstrict':
          case 'prosecdef':
          case 'procost':
          case 'proleakproof':
          case 'variables':
            return this.node_info.server < 90500;
          case 'prorows':
            return this.node_info.server.version < 90500 ||
                !m.get('proretset');
          case 'funcowner':
          case 'lanname':
          case 'proargs':
            return true;
          default:
            return false;
          }
        },
        validate: function()
        {
          var err = {},
            errmsg,
            seclabels = this.get('seclabels');

          if (_.isUndefined(this.get('name')) || String(this.get('name')).replace(/^\s+|\s+$/g, '') == '') {
            err['name'] = gettext('Name cannot be empty.');
            errmsg = errmsg || err['name'];
          }

          if (_.isUndefined(this.get('pronamespace')) || String(this.get('pronamespace')).replace(/^\s+|\s+$/g, '') == '') {
            err['pronamespace'] = gettext('Schema cannot be empty.');
            errmsg = errmsg || err['pronamespace'];
          }

          if (_.isUndefined(this.get('lanname')) || String(this.get('lanname')).replace(/^\s+|\s+$/g, '') == '') {
            err['lanname'] = gettext('Language cannot be empty.');
            errmsg = errmsg || err['lanname'];
          }

          if (_.isUndefined(this.get('prosrc')) || String(this.get('prosrc')).replace(/^\s+|\s+$/g, '') == '') {
            err['prosrc'] = gettext('Code cannot be empty.');
            errmsg = errmsg || err['prosrc'];
          }


          if (seclabels) {
            var secLabelsErr;
            for (var i = 0; i < seclabels.models.length && !secLabelsErr; i++) {
              secLabelsErr = (seclabels.models[i]).validate.apply(seclabels.models[i]);
              if (secLabelsErr) {
                err['seclabels'] = secLabelsErr;
                errmsg = errmsg || secLabelsErr;
              }
            }
          }

          this.errorModel.clear().set(err);

          return null;
        },
      }),
    });
  }

  return pgBrowser.Nodes.procedure;
});
