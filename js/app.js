var app = app || {};

/**
 * 商品モデル
 */
app.Product = Backbone.Model.extend({
    defaults: {
        id: null,
        name: null,
        price: 0,
        quantity: 0
    },
});

/**
 * 商品データ
 */
app.ProductCollection = Backbone.Collection.extend({
    model: app.Product,

    // バックエンドとしてlocalStorageを利用します
    localStorage: new Backbone.LocalStorage('backbone-ec'),

    initialize: function() {
        this.on('change:quantity', this.sumQuantity);
        this.on('change:quantity', this.updateQuantity);
    },

    sumQuantity: function() {
        return this.reduce(
            function(memo, product) {
                return memo + product.get('quantity');
            }, 0);
    },
});

/**
 * 商品ビュー（テーブルの1行）
 */
app.TableRowView = Backbone.View.extend({
    // el: null,

    tagName: 'tr',

    className: 'product-item mb-2',

    template: _.template($('#tr-template').html()),

    events: {
        'click button.inc-quantity': 'incQuantity',
        'click button.dec-quantity': 'decQuantity',
        'click button.destroy': 'destroyProduct',
    },

    initialize: function() {
        this.model.on('change', this.updateQuantity, this);
    },

    render: function() {
        var html = this.template(this.model.toJSON());
        this.$el.html(html);

        this.quantity = this.$('td.quantity');

        return this;
    },

    incQuantity: function(e) {
        var old = this.model.get('quantity');
        this.model.set('quantity', old+1);
    },

    decQuantity: function(e) {
        var old = this.model.get('quantity');
        if (old > 0) {
            this.model.set('quantity', old-1);
        }
    },

    updateQuantity: function() {
        this.quantity.html(this.model.get('quantity'));
    },

    destroyProduct: function(e) {
        console.log('destroyProduct');
        this.trigger('should-remove', this.model);
    }
});

/**
 * 商品一覧ビュー
 */
app.TableView = Backbone.View.extend({
    el: 'table',

    collection: [],

    events: {
        'click th:nth-child(2)>a': 'sortByName',
        'click th:nth-child(3)>a': 'sortByPrice',
        'click th:nth-child(4)>a': 'sortByQuantity',
    },

    /**
     * 初期化処理
     */
    initialize: function() {
        this.collection = new app.ProductCollection();

        this.listenTo(this.collection, 'all', this._debug);
        this.listenTo(this.collection, 'reset', this.reset);
        this.listenTo(this.collection, 'update sort', this.render);
        this.listenTo(this.collection, 'change', this.updateSum);

        this.collection.fetch();

        this.render();
    },

    /**
     * 描画処理
     */
    render: function() {
        this.renderAll();

        return this;
    },

    /**
     * 商品データをすべて描画する
     */
    renderAll: function() {
        this.$('tbody').html('');
        this.collection.each(this.renderOne, this);
        this.updateSum();
    },

    /**
     * 商品を1つ追加して表示する
     */
    renderOne: function(model) {
        var row = new app.TableRowView({ model: model });
        this.$('tbody').append(row.render().$el);
        this.listenTo(row, 'should-remove', this.removeProduct);

        return this;
    },

    /**
     * 商品を1件追加する
     */
    addProduct: function(model) {
        console.log('addProduct');
        // this.collection.add(model);
        this.collection.create(model);
    },

    /**
     * 合計数量を再計算する
     */
    updateSum: function(e) {
        this.$('#sum_quantity').text(this.collection.sumQuantity());
    },

    reset: function() {
        this.renderAll();
    },

    /**
     * 商品を1件削除する
     */
    removeProduct: function(model) {
        console.log(model);
        console.log(model.get('id'));
        // this.collection.remove(model);
        _.invoke([model], 'destroy');
        this.updateSum();

        if (this.collection.length == 0) {
            this.$('tbody').html('');
            this.$('tbody').append(_.template('<tr><td colspan="5" style="text-align:center;">データがありません。</td></tr>'));
        }
    },

    /**
     * 商品名でソートする
     */
    sortByName: function(e) {
        this.$('th>a>i.active').removeClass('active');

        $(e.target).toggleClass('fa-sort-amount-up fa-sort-amount-down');
        $(e.target).addClass('active');

        this.sortBy('name', $(e.target).hasClass('fa-sort-amount-down'));
    },

    /**
     * 価格でソートする
     */
    sortByPrice: function(e) {
        this.$('th>a>i.active').removeClass('active');

        $(e.target).toggleClass('fa-sort-numeric-up fa-sort-numeric-down');
        $(e.target).addClass('active');

        this.sortBy('price', $(e.target).hasClass('fa-sort-numeric-down'));
    },

    /**
     * 数量でソートする
     */
    sortByQuantity: function(e) {
        this.$('th>a>i.active').removeClass('active');

        $(e.target).toggleClass('fa-sort-numeric-up fa-sort-numeric-down');
        $(e.target).addClass('active');

        this.sortBy('quantity', $(e.target).hasClass('fa-sort-numeric-down'));
    },

    /**
     * ソート処理
     */
    sortBy: function(orderBy, asc_desc) {
        if (asc_desc) {
            this.collection.comparator = function(left, right) {
                return left.get(orderBy) > right.get(orderBy);
            };
        } else {
            this.collection.comparator = function(left, right) {
                return left.get(orderBy) < right.get(orderBy);
            };
        }

        this.collection.sort();
    },

    /**
     * すべてのイベントをコンソールに出力する
     */
    _debug: function(e) {
        console.log('debug: ' + e);
    }
});

/**
 * The Backbone EC Application
 */
app.BackboneECApp = Backbone.View.extend({
    el: '#app',

    data: {
        products: [
            { id: 1, name: 'iMac', price: 200000, quantity: 10 },
            { id: 2, name: 'iMac Pro', price: 200000, quantity: 3 },
            { id: 3, name: 'MacBook Pro 13inch late2018', price: 200000, quantity: 3 },
            { id: 4, name: 'iPhone X', price: 114000, quantity: 18 },
        ]
    },

    events: {
        'click button[type="submit"]': 'addProduct',
        'click button#save': 'saveCollection',
    },

    tableView: null,

    initialize: function() {
        // this.loadCollection();

        this.tableView = new app.TableView();
        // this.tableView.addProduct(this.data.products);
    },

    render: function() {
        return this;
    },

    addProduct: function(e) {
        e.preventDefault();

        var inputTitle = $('input[name=title]');
        var inputPrice = $('input[name=price]');
        var inputQuantity = $('input[name=quantity]');

        console.log(format_money(inputPrice.val()));

        if (inputTitle.val().trim()) {  // TODO validate
            var product = new app.Product({
                name: inputTitle.val(),
                price: inputPrice.val()-0 || 0,
                quantity: inputQuantity.val()-0 || 0,
            });
            this.tableView.addProduct(product);

            inputTitle.val('');
            inputPrice.val('');
            inputQuantity.val('');
        }
    },

    loadCollection: function() {
        var data = JSON.parse(localStorage.getItem('backbone-ec.collection'));
        if (data) {
            this.data.products = data;
        }
    },

    saveCollection: function() {
        localStorage.setItem('backbone-ec.collection', JSON.stringify(this.tableView.collection.toJSON()));
    }
});

format_money = function(number) {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(number)
};
