# Database Setup

This folder contains sample data for the True Astrotalk MongoDB database.

## 📊 Sample Collections

| Collection | Description |
|------------|-------------|
| `users.json` | Sample users (admin, customer, astrologer) |

## 🚀 Quick Setup

```bash
# Import sample data
mongoimport --db trueastrotalkDB --collection users --file database/users.json --jsonArray

# Or run the setup script (coming soon)
# ./database/import-data.sh
```

## 👥 Sample Login Credentials

- **Admin**: admin@trueastrotalk.com / admin123
- **Customer**: customer@test.com / customer123  
- **Astrologer**: astrologer@test.com / astrologer123

*Note: Passwords in JSON are placeholders. Use the above credentials for testing.*