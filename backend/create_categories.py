import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uchef_project.settings')
django.setup()

from meals.models import MealCategory

# Define default meal categories
default_categories = [
    {
        'name': 'Appetizer',
        'description': 'Small dishes served before the main course'
    },
    {
        'name': 'Main Course',
        'description': 'Primary dish in a meal'
    },
    {
        'name': 'Dessert',
        'description': 'Sweet dishes served after the main course'
    },
    {
        'name': 'Beverage',
        'description': 'Drinks and refreshments'
    },
    {
        'name': 'Side Dish',
        'description': 'Smaller dishes served alongside the main course'
    },
    {
        'name': 'Special',
        'description': 'Chef\'s special dishes and seasonal offerings'
    },
]

# Create categories if they don't exist
for category in default_categories:
    MealCategory.objects.get_or_create(
        name=category['name'],
        defaults={'description': category['description']}
    )

print(f"Created {len(default_categories)} meal categories")
print("Available categories:")
for category in MealCategory.objects.all():
    print(f"- {category.name} (ID: {category.id})")
