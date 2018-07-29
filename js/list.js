var app = app || {};

app.Product = Backbone.Model.extend({
    defaults: {
        id: null,
        name: null,
        quantity: 0
    },
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
        this.trigger('should-remove', this.model);
    }
});

app.MyView = Backbone.View.extend({
    el: '#app',

    data: {
        products: [
            { id: 1, name: 'Boots', quantity: 10 },
            { id: 2, name: 'Socks', quantity: 3 },
            { id: 3, name: 'Shoes', quantity: 18 },
        ]
    },

    collection: [],

    events: {
        'click button[type="submit"]': 'addProduct',
    },

    template: _.template($('#list-template').html()),

    initialize: function() {
        this.collection = new app.ProductCollection();
        this.listenTo(this.collection, 'reset', this.reset);
        this.listenTo(this.collection, 'change', this.render);
        this.listenTo(this.collection, 'update', this.render);
        this.collection.add(this.data.products);
        this.collection.trigger('reset');

        this.$el.append(this.template());

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

    addProduct: function(e) {
        var input = $('input[name=title]');
        if (input.val().trim()) {
            var product = new app.Product({ name: input.val() });
            this.collection.add(product);
            input.val('');
        }
    },

    reset: function() {
        console.log('reset');
    },

    removeProduct: function(model) {
        console.log('removeProduct');
        console.log(model);
        this.collection.remove(model);
        console.log(this.collection);
    }
});

