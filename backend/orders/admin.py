from django.contrib import admin
from .models import Order, OrderItem, Payment

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('price',)

class PaymentInline(admin.StackedInline):
    model = Payment
    extra = 0
    readonly_fields = ('payment_date',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'restaurant', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'created_at', 'restaurant')
    search_fields = ('user__username', 'restaurant__name', 'delivery_address')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OrderItemInline, PaymentInline]
    list_editable = ('status',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is not a superuser and is a restaurant owner, only show their restaurant's orders
        if not request.user.is_superuser and request.user.user_type == 'restaurant':
            try:
                restaurant = request.user.restaurant
                return qs.filter(restaurant=restaurant)
            except:
                return qs.none()
        return qs

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'get_meal_name', 'quantity', 'price', 'special_instructions')
    list_filter = ('order', 'meal', 'custom_meal')
    search_fields = ('order__id', 'meal__name', 'custom_meal__name', 'special_instructions')
    readonly_fields = ('price',)
    
    def get_meal_name(self, obj):
        if obj.meal:
            return obj.meal.name
        elif obj.custom_meal:
            return f"Custom: {obj.custom_meal.name}"
        return "N/A"
    get_meal_name.short_description = 'Meal'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is not a superuser and is a restaurant owner, only show their restaurant's order items
        if not request.user.is_superuser and request.user.user_type == 'restaurant':
            try:
                restaurant = request.user.restaurant
                return qs.filter(order__restaurant=restaurant)
            except:
                return qs.none()
        return qs

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'payment_method', 'status', 'payment_date')
    list_filter = ('status', 'payment_method', 'payment_date')
    search_fields = ('order__id', 'transaction_id')
    readonly_fields = ('payment_date',)
    list_editable = ('status',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is not a superuser and is a restaurant owner, only show their restaurant's payments
        if not request.user.is_superuser and request.user.user_type == 'restaurant':
            try:
                restaurant = request.user.restaurant
                return qs.filter(order__restaurant=restaurant)
            except:
                return qs.none()
        return qs