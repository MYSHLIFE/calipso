define("RepositoryBrowser", ["Class", "jquery", "PubSub", "repository-browser-i18n-" + (window && window.__DEPS__ && window.__DEPS__.lang || "en"), "jstree", "jqgrid", "jquery-layout"], function (m, d, n, o) {
  function p(a) {
    a.each(function () {
      d(this).attr("unselectable", "on").css({"-moz-user-select":"none", "-webkit-user-select":"none", "user-select":"none"}).each(function () {
        this.onselectstart = function () {
          return!1
        }
      })
    })
  }

  var j = [], k = 0, g = (new Date).getTime(), q = {repositoryManager:null, repositoryFilter:[], objectTypeFilter:[], renditionFilter:["cmis:none"],
    filter:["url"], element:null, isFloating:!1, verticalPadding:100, horizontalPadding:50, maxHeight:1E3, minHeight:400, minWidth:400, maxWidth:1200, treeWidth:300, listWidth:"auto", pageSize:8, adaptPageSize:!1, rowHeight:32, rootPath:"", rootFolderId:"aloha", columns:{icon:{title:"", width:30, sortable:!1, resizable:!1}, name:{title:"Name", width:200, sorttype:"text"}, url:{title:"URL", width:220, sorttype:"text"}, preview:{title:"Preview", width:150, sorttype:"text"}}, i18n:{Browsing:"Browsing", Close:"Close", "in":"in", "Input search text...":"Input search text...",
      numerous:"numerous", of:"of", "Repository Browser":"Repository Browser", Search:"Search", "Searching for":"Searching for", Viewing:"Viewing"}};
  return m.extend({_cachedRepositoryObjects:{}, _searchQuery:null, _orderBy:null, _prefilledValue:null, $_grid:null, $_tree:null, $_list:null, _isOpened:!0, _constructor:function () {
    this.init.apply(this, arguments)
  }, init:function (a) {
    a = d.extend({}, q, a, {i18n:o});
    if (!a.element || 0 === a.element.length) {
      a.isFloating = !0, a.element = this._createOverlay();
    }
    if (a.maxWidth < a.minWidth) {
      a.maxWidth =
        a.minWidth;
    }
    d.extend(this, a);
    this._prefilledValue = this._i18n("Input search text...");
    this._cachedRepositoryObjects = {};
    this._pagingCount = this._orderBy = this._searchQuery = null;
    this._pagingOffset = 0;
    this._pagingBtns = {first:null, end:null, next:null, prev:null};
    this._initializeUI();
    j.push(this);
    n.pub("repository-browser.initialized", {data:this})
  }, _i18n:function (a) {
    return this.i18n[a] || a
  }, _initializeUI:function () {
    this.element.attr("data-repository-browser", ++g);
    this.element.width(this.maxWidth);
    this.$_grid =
      this._createGrid(this.element).resize();
    this._setInitialHeight();
    this.$_tree = this._createTree(this.$_grid.find(".ui-layout-west"));
    this.$_list = this._createList(this.$_grid.find(".ui-layout-center"));
    var a = this, b = this.treeWidth / 5;
    this.$_grid.layout({enableCursorHotkey:!1, west__size:this.treeWidth - 1, west__minSize:this.treeWidth - b, west__maxSize:this.treeWidth + b, center__size:"auto", paneClass:"ui-layout-pane", resizerClass:"ui-layout-resizer", togglerClass:"ui-layout-toggler", onresize:function (b, d) {
      "center" ===
        b && a.$_list.setGridWidth(d.width())
    }}).sizePane("west", this.treeWidth);
    p(this.$_grid);
    this._preloadImages();
    d(function () {
      d(window).resize(function () {
        a._onWindowResized()
      })
    });
    this.element.mousedown(function () {
      d.each(j, function (a) {
        this.element.css("z-index", 99999 + a)
      });
      d(this).css("z-index", 99999 + j.length + 1)
    });
    d(".repository-browser-grid").css("width", this.maxWidth);
    this.close();
    this._adaptPageSize()
  }, _setInitialHeight:function () {
    var a = this.maxHeight - d(window).height() + this.verticalPadding;
    this.$_grid.height(a >
      0 ? Math.max(this.minHeight, this.maxHeight - a) : this.maxHeight)
  }, _onWindowResized:function () {
    var a = this.maxWidth - d(window).width() + this.horizontalPadding, a = a > 0 ? Math.max(this.minWidth, this.maxWidth - a) : this.maxWidth;
    this.element.width(a);
    this.$_grid.width(a);
    this._setInitialHeight();
    a = this.$_grid.find(".repository-browser-tree-header");
    this.$_tree.height(this.$_grid.height() - a.outerHeight(!0));
    a = this.$_grid.find(".ui-layout-center");
    a.find(".ui-jqgrid-bdiv").height(this.$_grid.height() - (a.find(".ui-jqgrid-titlebar").height() +
      a.find(".ui-jqgrid-hdiv").height() + a.find(".ui-jqgrid-pager").height()));
    this._adaptPageSize() && this._currentFolder && this._fetchItems(this._currentFolder)
  }, _preloadImages:function () {
    for (var a = this.rootPath + "img/", b = "arrow-000-medium.png,arrow-180.png,arrow-315-medium.png,arrow-stop-180.png,arrow-stop.png,arrow.png,control-stop-square-small.png,folder-horizontal-open.png,folder-open.png,magnifier-left.png,page.png,picture.png,sort-alphabet-descending.png,sort-alphabet.png".split(","), c = b.length; c;) {
      document.createElement("img").src =
        a + b[--c]
    }
  }, _processRepoResponse:function (a, b, c) {
    var d = [], f;
    typeof b === "function" && (c = b, b = void 0);
    for (f = 0; f < a.length; f++) {
      d.push(this._harvestRepoObject(a[f]));
    }
    c(d, b)
  }, _harvestRepoObject:function (a) {
    ++g;
    this._cachedRepositoryObjects[g] = d.extend(a, {uid:g, loaded:!1});
    return this._processRepoObject(this._cachedRepositoryObjects[g])
  }, _processRepoObject:function (a) {
    var b, c, e, f = this;
    switch (a.baseType) {
      case "folder":
        b = "folder";
        break;
      case "document":
        b = "document"
    }
    c = a.hasMoreItems || a.baseType === "folder" ? "closed" :
      null;
    a.hasMoreItems === !1 && (c = null);
    a.children && (e = [], d.each(a.children, function () {
      e.push(f._harvestRepoObject(this));
      c = "open"
    }));
    this._currentFolder && this._currentFolder.id === a.id && window.setTimeout(function () {
      f.$_tree.jstree("select_node", "li[data-repo-obj='" + a.uid + "']")
    }, 0);
    return{data:{title:a.name, attr:{"data-repo-obj":a.uid}, icon:b || ""}, attr:{rel:a.type, "data-repo-obj":a.uid}, state:c, resource:a, children:e}
  }, _fetchRepoRoot:function (a) {
    if (!this._currentFolder) {
      this._currentFolder = this.getSelectedFolder();
    }
    this.repositoryManager && this.getRepoChildren({inFolderId:this.rootFolderId, repositoryFilter:this.repositoryFilter}, a)
  }, _getObjectFromCache:function (a) {
    return a && a.length ? this._cachedRepositoryObjects[a.find("a:first").attr("data-repo-obj")] : null
  }, _onTreeNodeSelected:function (a, b) {
    if (!b.args[0].context) {
      var c = this._getObjectFromCache(b.rslt.obj);
      if (c) {
        this._pagingOffset = 0, this._clearSearch(), this._currentFolder = c, this._fetchItems(c);
      }
      this.folderSelected(c)
    }
  }, _createTree:function (a) {
    var b = d('<div class="repository-browser-tree">'),
      c = d('<div class="repository-browser-tree-header repository-browser-grab-handle">' + this._i18n("Repository Browser") + "</div>");
    a.append(c, b);
    b.height(this.$_grid.height() - c.outerHeight(!0));
    b.bind("loaded.jstree", function () {
      d(this).find(">ul>li:first").css("padding-top", 5);
      b.jstree("open_node", 'li[rel="repository"]')
    });
    var e = this;
    b.bind("select_node.jstree", function (a, b) {
      e._onTreeNodeSelected(a, b)
    });
    b.bind("open_node.jstree", function (a, b) {
      e.folderOpened(b.rslt.obj)
    });
    b.bind("close_node.jstree", function (a, b) {
      e.folderClosed(b.rslt.obj)
    });
    b.jstree({types:this.types, rootFolderId:this.rootFolderId, plugins:["themes", "json_data", "ui", "types"], core:{animation:250}, themes:{url:this.rootPath + "css/jstree.css", dots:!0, icons:!0, theme:"browser"}, json_data:{data:function (a, b) {
      e.repositoryManager ? (e.jstree_callback = b, e._fetchSubnodes(a, b)) : b()
    }, correct_state:!0}, ui:{select_limit:1}});
    return b
  }, _createGrid:function (a) {
    var b = d('<div class="repository-browser-grid\t\t\t\t             repository-browser-shadow\t\t\t\t\t\t\t repository-browser-rounded-top">\t\t\t\t\t<div class="ui-layout-west"></div>\t\t\t\t\t<div class="ui-layout-center"></div>\t\t\t\t</div>');
    a.append(b);
    return b
  }, _createList:function (a) {
    var b = d('<table id="repository-browser-list-' + ++g + '" class="repository-browser-list"></table>'), c = [
      {name:"id", sorttype:"int", firstsortorder:"asc", hidden:!0}
    ], e = [""];
    d.each(this.columns, function (a, b) {
      e.push(b.title || "&nbsp;");
      c.push({name:a, width:b.width, sortable:b.sortable, sorttype:b.sorttype, resizable:b.resizable, fixed:b.fixed})
    });
    var f = "repository-browser-list-page-" + ++g;
    a.append(b, d('<div id="' + f + '">'));
    b.jqGrid({datatype:"local", width:a.width(),
      shrinkToFit:!0, colNames:e, colModel:c, caption:"&nbsp;", altRows:!0, altclass:"repository-browser-list-altrow", resizeclass:"repository-browser-list-resizable", pager:"#" + f, viewrecords:!0, onPaging:function () {
      }, loadError:function () {
      }, ondblClickRow:function () {
      }, gridComplete:function () {
      }, loadComplete:function () {
      }});
    a.find(".ui-jqgrid-bdiv").height(this.$_grid.height() - (a.find(".ui-jqgrid-titlebar").height() + a.find(".ui-jqgrid-hdiv").height() + a.find(".ui-jqgrid-pager").height()));
    var h = this;
    b.click(function () {
      h.rowClicked.apply(h,
        arguments)
    });
    a.find(".ui-pg-button").unbind().find(">span.ui-icon").each(function () {
      var a = this.className.match(/ui\-icon\-seek\-([a-z]+)/)[1];
      h._pagingBtns[a] = d(this).parent().addClass("ui-state-disabled").click(function () {
        d(this).hasClass("ui-state-disabled") || h._doPaging(a)
      })
    });
    a.find(".ui-pg-input").parent().hide();
    a.find(".ui-separator").parent().css("opacity", 0).first().hide();
    this._createTitlebar(a);
    var l = b[0].p;
    a.find(".ui-jqgrid-view tr:first th div").each(function (a) {
      !1 !== l.colModel[a].sortable &&
      (d(this).css("cursor", "pointer"), d(this).unbind().click(function (b) {
        b.stopPropagation();
        h._sortList(l.colModel[a], this)
      }))
    });
    return b
  }, _clearSearch:function () {
    this.$_grid.find(".repository-browser-search-field").val(this._prefilledValue).addClass("repository-browser-search-field-empty");
    this._searchQuery = null
  }, _createTitlebar:function (a) {
    var a = a.find(".ui-jqgrid-titlebar"), b = d('<div class="repository-browser-btns">\t\t\t\t\t<input type="text" class="repository-browser-search-field" />\t\t\t\t\t<span class="repository-browser-btn repository-browser-search-btn">\t\t\t\t\t\t<span class="repository-browser-search-icon"></span>\t\t\t\t\t</span>\t\t\t\t\t<span class="repository-browser-btn repository-browser-close-btn">' +
      this._i18n("Close") + '</span>\t\t\t\t\t<div class="repository-browser-clear"></div>\t\t\t\t</div>'), c = this;
    a.addClass("repository-browser-grab-handle").append(b);
    a.find(".repository-browser-search-btn").html(this._i18n("Search")).click(function () {
      c._triggerSearch()
    });
    b = a.find(".repository-browser-search-field");
    this._clearSearch();
    b.keypress(function (a) {
      13 === a.keyCode && c._triggerSearch()
    });
    b.focus(function () {
      d(this).val() === c._prefilledValue && d(this).val("").removeClass("repository-browser-search-field-empty")
    });
    b.blur(function () {
      d(this).val() === "" && c._clearSearch()
    });
    a.find(".repository-browser-close-btn").click(function () {
      c.close()
    });
    a.find(".repository-browser-btn").mousedown(function () {
      d(this).addClass("repository-browser-pressed")
    }).mouseup(function () {
        d(this).removeClass("repository-browser-pressed")
      })
  }, _triggerSearch:function () {
    var a = this.$_grid.find("input.repository-browser-search-field"), b = a.val();
    if (d(a).hasClass("aloha-browser-search-field-empty") || "" === b) {
      b = null;
    }
    this._pagingOffset = 0;
    this._searchQuery =
      b;
    this._fetchItems(this._currentFolder)
  }, _sortList:function (a, b) {
    this.$_grid.find("span.ui-grid-ico-sort").addClass("ui-state-disabled");
    a.sortorder = "asc" === a.sortorder ? "desc" : "asc";
    d(b).find("span.s-ico").show().find(".ui-icon-" + a.sortorder).removeClass("ui-state-disabled");
    this._setSortOrder(a.name, a.sortorder);
    this._fetchItems(this._currentFolder)
  }, _doPaging:function (a) {
    switch (a) {
      case "first":
        this._pagingOffset = 0;
        break;
      case "end":
        this._pagingOffset = this._pagingCount % this.pageSize === 0 ? this._pagingCount -
          this.pageSize : this._pagingCount - this._pagingCount % this.pageSize;
        break;
      case "next":
        this._pagingOffset += this.pageSize;
        break;
      case "prev":
        if (this._pagingOffset -= this.pageSize, this._pagingOffset < 0) {
          this._pagingOffset = 0
        }
    }
    this._fetchItems(this._currentFolder)
  }, _setSortOrder:function (a, b) {
    var c = {}, d = !1, f = this._orderBy || [], h, g, i;
    c[a] = b || "asc";
    for (i = 0; i < f.length; ++i) {
      h = f[i];
      for (g in h) {
        if (h.hasOwnProperty(g) && g === a) {
          f.splice(i, 1);
          f.unshift(c);
          d = !0;
          break
        }
      }
      if (d) {
        break
      }
    }
    d && f.unshift(c);
    this._orderBy = f
  }, _listItems:function (a) {
    var b =
      this.$_list.clearGridData(), c, e;
    for (c = 0; c < a.length; c++) {
      e = a[c].resource, b.addRowData(e.uid, d.extend({id:e.id}, this.renderRowCols(e)))
    }
  }, handleTimeout:function () {
  }, _processItems:function (a, b) {
    this._pagingCount = b && d.isNumeric(b.numItems) ? b.numItems : null;
    this.$_grid.find(".loading").hide();
    this.$_list.show();
    this._listItems(a);
    var c = this._pagingBtns;
    this._pagingOffset <= 0 ? c.first.add(c.prev).addClass("ui-state-disabled") : c.first.add(c.prev).removeClass("ui-state-disabled");
    d.isNumeric(this._pagingCount) ?
      this._pagingOffset + this.pageSize >= this._pagingCount ? c.end.add(c.next).addClass("ui-state-disabled") : c.end.add(c.next).removeClass("ui-state-disabled") : (c.end.addClass("ui-state-disabled"), a.length <= this.pageSize ? c.next.addClass("ui-state-disabled") : c.next.removeClass("ui-state-disabled"));
    var e;
    0 === a.length && 0 === this._pagingOffset ? e = c = 0 : (c = this._pagingOffset + 1, e = c + a.length - 1);
    this.$_grid.find(".ui-paging-info").html(this._i18n("Viewing") + " " + c + " - " + e + " " + this._i18n("of") + " " + (d.isNumeric(this._pagingCount) ?
      this._pagingCount : this._i18n("numerous")));
    b && b.timeout && this.handleTimeout()
  }, _createOverlay:function () {
    0 === d(".repository-browser-modal-overlay").length && d("body").append('<div class="repository-browser-modal-overlay" style="top: -99999px; z-index: 99999;"></div>');
    var a = this;
    d(".repository-browser-modal-overlay").click(function () {
      a.close()
    });
    var b = d('<div class="repository-browser-modal-window" style="top: -99999px; z-index: 99999;">');
    d("body").append(b);
    return b
  }, _fetchSubnodes:function (a, b) {
    if (-1 ===
      a) {
      this._fetchRepoRoot(b);
    } else {
      var c;
      for (c = 0; c < a.length; c++) {
        var d = this._getObjectFromCache(a.eq(c));
        d && this.fetchChildren(d, b)
      }
    }
  }, getRepoChildren:function (a, b) {
    if (this.repositoryManager) {
      var c = this;
      this.repositoryManager.getChildren(a, function (a) {
        c._processRepoResponse(a, b)
      })
    }
  }, queryRepository:function (a, b) {
    if (this.repositoryManager) {
      var c = this;
      this.repositoryManager.query(a, function (a) {
        c._processRepoResponse(a.results > 0 ? a.items : [], {numItems:a.numItems, hasMoreItems:a.hasMoreItems, timeout:a.timeout},
          b)
      })
    }
  }, renderRowCols:function (a) {
    var b = {};
    d.each(this.columns, function (c) {
      switch (c) {
        case "icon":
          b.icon = '<div class="repository-browser-icon repository-browser-icon-' + a.type + '"></div>';
          break;
        default:
          b[c] = a[c] || "--"
      }
    });
    return b
  }, onSelect:function () {
  }, fetchChildren:function (a, b) {
    if ((!0 === a.hasMoreItems || "folder" === a.baseType) && !1 === a.loaded) {
      var c = this;
      this.getRepoChildren({inFolderId:a.id, repositoryId:a.repositoryId}, function (d) {
        c._cachedRepositoryObjects[a.uid].loaded = !0;
        typeof b === "function" && b(d)
      })
    }
  },
    rowClicked:function (a) {
      a = d(a.target).parent("tr");
      return a.length ? (a = this._cachedRepositoryObjects[a.attr("id")], this.onSelect(a), a) : null
    }, getFieldOfHeader:function (a) {
      return a.find("div.ui-jqgrid-sortable").attr("id").replace("jqgh_", "")
    }, _fetchItems:function (a) {
      if (a) {
        var b = typeof this._searchQuery === "string";
        this.$_list.setCaption(typeof this._searchQuery === "string" ? this._i18n("Searching for") + ' "' + this._searchQuery + '" ' + this._i18n("in") + " " + a.name : this._i18n("Browsing") + ": " + a.name);
        this.$_list.hide();
        this.$_grid.find(".loading").show();
        var c = this;
        this.queryRepository({repositoryId:a.repositoryId, inFolderId:a.id, queryString:this._searchQuery, orderBy:this._orderBy, skipCount:this._pagingOffset, maxItems:this.pageSize, objectTypeFilter:this.objectTypeFilter, renditionFilter:this.renditionFilter, filter:this.filter, recursive:b}, function (a, b) {
          c._processItems(a, b)
        })
      }
    }, setObjectTypeFilter:function (a) {
      this.objectTypeFilter = typeof a === "string" ? [a] : a
    }, getObjectTypeFilter:function () {
      return this.objectTypeFilter
    },
    show:function () {
      this.open()
    }, open:function () {
      if (!this._isOpened) {
        this._isOpened = !0;
        var a = this.element;
        this.isFloating ? (d(".repository-browser-modal-overlay").stop().css({top:0, left:0}).show(), a.stop().show(), this._onWindowResized(), this.$_grid.resize(), d(window), a.css({left:this.horizontalPadding / 2, top:this.verticalPadding / 2}).draggable({handle:a.find(".repository-browser-grab-handle")}), this.$_grid.css({marginTop:0, opacity:0}).animate({marginTop:0, opacity:1}, 1500, "easeOutExpo", function () {
          d.browser.msie &&
          d(this).add(a).css("filter", "progid:DXImageTransform.Microsoft.gradient(enabled=false)")
        })) : (a.stop().show().css({opacity:1, filter:"progid:DXImageTransform.Microsoft.gradient(enabled=false)"}), this._onWindowResized(), this.$_grid.resize());
        ++k
      }
    }, close:function () {
      if (this._isOpened) {
        this._isOpened = !1, this.element.fadeOut(250, function () {
          d(this).css("top", 0).hide();
          (0 === k || 0 === --k) && d(".repository-browser-modal-overlay").hide()
        })
      }
    }, refresh:function () {
      this._currentFolder && this._fetchItems(this._currentFolder)
    },
    folderOpened:function (a) {
      (a = this._getObjectFromCache(a)) && this.repositoryManager && this.repositoryManager.folderOpened(a)
    }, folderClosed:function (a) {
      (a = this._getObjectFromCache(a)) && this.repositoryManager && this.repositoryManager.folderClosed(a)
    }, folderSelected:function (a) {
      this.repositoryManager && this.repositoryManager.folderSelected(a)
    }, getSelectedFolder:function () {
      if (this.repositoryManager && typeof this.repositoryManager.getSelectedFolder === "function") {
        return this.repositoryManager.getSelectedFolder()
      }
    },
    _adaptPageSize:function () {
      var a;
      return!this.adaptPageSize || !this.$_list || !this.rowHeight ? !1 : (a = this.$_grid.find(".ui-jqgrid-bdiv").innerHeight() - 20) ? (a = Math.floor(a / this.rowHeight), a <= 0 && (a = 1), a !== this.pageSize ? (this.pageSize = a, !0) : !1) : !1
    }})
});
define("repository-browser-i18n-de", [], function () {
  return{Browsing:"Durchsuchen", Close:"Schließen", "in":"in", "Input search text...":"Suchtext einfügen...", numerous:"zahlreiche", of:"von", "Repository Browser":"Repository Browser", Search:"Suchen", "Searching for":"Suche nach", Viewing:"Anzeige", "button.switch-metaview.tooltip":"Zwischen Metaansicht und normaler Ansicht umschalten"}
});
define("repository-browser-i18n-en", [], function () {
  return{Browsing:"Browsing", Close:"Close", "in":"in", "Input search text...":"Input search text...", numerous:"numerous", of:"of", "Repository Browser":"Repository Browser", Search:"Search", "Searching for":"Searching for", Viewing:"Viewing", "button.switch-metaview.tooltip":"Switch between meta and normal view"}
});