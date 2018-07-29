var app = app || {};

app.Product = Backbone.Model.extend({
    defaults: {
        id: null,
        name: null,
        quantity: 0
    },

    render: function() {
        return this;
    }
});

app.ProductCollection = Backbone.Collection.extend({
    model: app.Product,

    initialize: function() {
        this.on('change', this.sumQuantity);
        this.on('change', this.updateQuantity);
    },

    sumQuantity: function() {
        return this.reduce(
            function(memo, product) {
                return memo + product.get('quantity');
            }, 0);
    },
});

app.ListItemView = Backbone.View.extend({
    // el: null,

    tagName: 'li',

    className: 'product-item mb-2',

    template: _.template($('#li-template').html()),

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

        this.quantity = this.$('span.quantity');

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

app.MyView = Backbone.View.extend({
    el: '#app',

    data: {
        title: 'Hello, world',
        products: [
            { id: 1, name: 'Boots', quantity: 10 },
            { id: 2, name: 'Socks', quantity: 3 },
            { id: 3, name: 'Shoes', quantity: 18 },
        ]
    },

    collection: [],

    events: {
        'click button[type=submit]': 'updateTitle',
        // 'click button.inc-quantity': 'incQuantity',
        'click button.dec-quantity': 'decQuantity',
    },

    template: _.template($('#list-template').html()),

    initialize: function() {
        var button = $('<button class="btn btn-info">ボタン</button>');
        var cancel_btn = $('<button class="btn btn-secondary">キャンセル</button>');
        this.$el.append(button);
        this.$el.append(cancel_btn);

        this.collection = new app.ProductCollection();
        this.listenTo(this.collection, 'reset', this.reset);
        this.collection.add(this.data.products);
        this.collection.trigger('reset');

        this.$el.append(this.template());

        var btn_compiled = _.template('<button type="submit" class="btn btn-primary"><%= label %></button>');
        var submit_btn = btn_compiled({ label: "送信する" });
        this.$('.form-group').after(submit_btn);

        // this.collection.each(this.renderOne, this);
        this.collection.on('change', this.render, this);
        // this.collection.on('sync', this.render, this);
        this.collection.on('update', this.render, this);

        this.render();
    },

    render: function() {
        this.renderAll();

        this.$('#sum_quantity').text(this.collection.sumQuantity());

        return this;
    },

    renderAll: function() {
        this.$('ul').html('');
        this.collection.each(this.renderOne, this);
    },

    renderOne: function(model) {
        var itemView = new app.ListItemView({ model: model });
        this.$('ul').append(itemView.render().$el);
        this.listenTo(itemView, 'should-remove', this.removeProduct);

        return this;
    },

    reset: function() {
        console.log('reset');
    },

    updateTitle: function() {
        this.data.title = $('input[name="title"]').val();
        this.$('h1').text(this.data.title);
    },

    removeProduct: function(model) {
        console.log('removeProduct');
        console.log(model);
        this.collection.remove(model);
        console.log(this.collection);
    }
});

