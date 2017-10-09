define('misc.sql', [
  'sources/gettext', 'underscore', 'underscore.string', 'jquery',
  'pgadmin.browser', 'pgadmin.alertify', 'pgadmin.browser.tool',
], function(gettext, _, S, $, pgBrowser, Alertify, pgTool) {

  if (pgBrowser.ShowNodeSQL)
    return pgBrowser.ShowNodeSQL;

  var wcDocker = window.wcDocker;

  pgBrowser.ShowNodeSQL = pgTool.extend({
    Init: function() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;
      _.bindAll(this, 'showSQL', 'sqlPanelVisibilityChanged');

      var sqlPanels;
      this.sqlPanels = sqlPanels = pgBrowser.docker.findPanels('sql');

      // We will listend to the visibility change of the SQL panel
      pgBrowser.Events.on(
        'pgadmin-browser:panel-sql:' + wcDocker.EVENT.VISIBILITY_CHANGED,
        this.sqlPanelVisibilityChanged
      );

      pgBrowser.Events.on(
        'pgadmin:browser:node:updated', function() {
          if (this.sqlPanels && this.sqlPanels.length) {
            $(this.sqlPanels[0]).data('node-prop', '');
            this.sqlPanelVisibilityChanged(this.sqlPanels[0]);
          }
        }, this
      );

      // Hmm.. Did we find the SQL panel, and is it visible (opened)?
      // If that is the case - we need to listen the browser tree selection
      // events.
      if (sqlPanels.length == 0) {
        pgBrowser.Events.on(
          'pgadmin-browser:panel-sql:' + wcDocker.EVENT.INIT,
          function() {
            if ((sqlPanels[0].isVisible()) || sqlPanels.length != 1) {
              pgBrowser.Events.on(
                'pgadmin-browser:tree:selected', this.showSQL
              );
            }
          }.bind(this)
        );
      }
      else {
        if ((sqlPanels[0].isVisible()) || sqlPanels.length != 1) {
          pgBrowser.Events.on('pgadmin-browser:tree:selected', this.showSQL);
        }
      }
    },
    showSQL: function(item, data, node) {
      /**
       * We can't start fetching the SQL immediately, it is possible - the user
       * is just using keyboards to select the node, and just traversing
       * through. We will wait for some time before fetching the Reversed
       * Engineering SQL.
       **/
      this.timeout && clearTimeout(this.timeout);

      var that = this;
      this.timeout =  setTimeout(
        function() {
          var sql = '';
          if (node) {
            sql = '-- ' + gettext('No SQL could be generated for the selected object.');
            var n_type = data._type,
              treeHierarchy = node.getTreeNodeHierarchy(item);

            // Avoid unnecessary reloads
            if (_.isEqual($(that.sqlPanels[0]).data('node-prop'), treeHierarchy)) {
              return;
            }
            // Cache the current IDs for next time
            $(that.sqlPanels[0]).data('node-prop', treeHierarchy);

            if (node.hasSQL) {

              sql = '';
              var url = node.generate_url(item, 'sql', data, true),
                timer;

              $.ajax({
                url: url,
                type:'GET',
                beforeSend: function() {
                  // Generate a timer for the request
                  timer = setTimeout(function(){
                    // notify user if request is taking longer than 1 second

                    pgBrowser.editor.setValue(
                      gettext('Retrieving data from the server...')
                    );
                  }, 1000);
                },
                success: function(res) {
                  if (pgBrowser.editor.getValue() != res) {
                    pgBrowser.editor.setValue(res);
                  }
                  clearTimeout(timer);
                },
                error: function(xhr, error, message) {
                  var _label = treeHierarchy[n_type].label;
                  pgBrowser.Events.trigger(
                    'pgadmin:node:retrieval:error', 'sql', xhr, error, message, item
                  );
                  if (
                    !Alertify.pgHandleItemError(xhr, error, message, {
                      item: item, info: treeHierarchy,
                    })
                  ) {
                    Alertify.pgNotifier(
                      error, xhr,
                      gettext('Error retrieving the information - %(label)s', {
                        label: message || _label,
                      }),
                      function() { }
                    );
                  }
                },
              });
            }
          }

          if (sql != '') {
            pgBrowser.editor.setValue(sql);
          }
        }, 400);
    },
    sqlPanelVisibilityChanged: function(panel) {
      if (panel.isVisible()) {
        var t = pgBrowser.tree,
          i = t.selected(),
          d = i && t.itemData(i),
          n = i && d && pgBrowser.Nodes[d._type];

        pgBrowser.ShowNodeSQL.showSQL.apply(pgBrowser.ShowNodeSQL, [i, d, n]);

        // We will start listening the tree selection event.
        pgBrowser.Events.on('pgadmin-browser:tree:selected', pgBrowser.ShowNodeSQL.showSQL);
      } else {
        // We don't need to listen the tree item selection event.
        pgBrowser.Events.off('pgadmin-browser:tree:selected', pgBrowser.ShowNodeSQL.showSQL);
      }
    },
  });

  return pgBrowser.ShowNodeSQL;
});
