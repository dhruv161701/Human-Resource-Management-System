from pymongo import MongoClient
from pymongo.errors import CollectionInvalid, ServerSelectionTimeoutError, ConfigurationError
import certifi
import ssl
import os
from config import Config

# Set DNS resolver to use Google's public DNS (helps with SRV lookup issues)
os.environ['DNS_RESOLVER'] = '8.8.8.8'

class Database:
    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            try:
                # Use certifi for SSL certificate verification on Windows
                cls._client = MongoClient(
                    Config.MONGODB_URI,
                    tlsCAFile=certifi.where(),
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000,
                    retryWrites=True,
                    w='majority',
                    directConnection=False
                )
                # Test connection
                cls._client.admin.command('ping')
                print("Successfully connected to MongoDB!")
                cls._db = cls._client[Config.DATABASE_NAME]
                cls._instance._initialize_collections()
            except (ServerSelectionTimeoutError, ConfigurationError) as e:
                print(f"MongoDB connection failed: {e}")
                print("\n=== TROUBLESHOOTING ===")
                print("DNS resolution failed. Try one of these solutions:")
                print("")
                print("Option 1: Install dnspython")
                print("  pip install dnspython")
                print("")
                print("Option 2: Use standard connection string (not SRV)")
                print("  Go to MongoDB Atlas -> Connect -> Drivers")
                print("  Select 'Connection String Only' and copy the standard URI")
                print("  Update MONGODB_URI in .env file")
                print("")
                print("Option 3: Change your DNS to Google DNS (8.8.8.8)")
                print("  Windows: Control Panel -> Network -> Change adapter settings")
                print("  -> Properties -> IPv4 -> Use DNS: 8.8.8.8, 8.8.4.4")
                print("")
                raise
        return cls._instance

    def _initialize_collections(self):
        """Initialize all required collections if they don't exist"""
        collections = {
            'users': {
                'validator': {
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['email', 'password', 'role', 'is_verified'],
                        'properties': {
                            'employee_id': {'bsonType': 'string'},
                            'email': {'bsonType': 'string'},
                            'password': {'bsonType': 'string'},
                            'role': {'enum': ['employee', 'admin', 'manager']},
                            'is_verified': {'bsonType': 'bool'},
                            'name': {'bsonType': 'string'},
                            'department': {'bsonType': 'string'},
                            'phone': {'bsonType': 'string'},
                            'address': {'bsonType': 'string'},
                            'job_title': {'bsonType': 'string'},
                            'profile_picture': {'bsonType': 'string'},
                            'salary': {'bsonType': 'object'},
                            'documents': {'bsonType': 'array'},
                            'created_at': {'bsonType': 'date'},
                            'updated_at': {'bsonType': 'date'}
                        }
                    }
                }
            },
            'otp_verifications': {
                'validator': {
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['email', 'otp', 'expires_at'],
                        'properties': {
                            'email': {'bsonType': 'string'},
                            'otp': {'bsonType': 'string'},
                            'expires_at': {'bsonType': 'date'},
                            'created_at': {'bsonType': 'date'}
                        }
                    }
                }
            },
            'attendance': {
                'validator': {
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['employee_id', 'date'],
                        'properties': {
                            'employee_id': {'bsonType': 'string'},
                            'date': {'bsonType': 'string'},
                            'check_in': {'bsonType': ['string', 'null']},
                            'check_out': {'bsonType': ['string', 'null']},
                            'total_hours': {'bsonType': ['double', 'int', 'long']},
                            'status': {'enum': ['Present', 'Absent', 'Half-day', 'Leave']},
                            'mode': {'bsonType': ['string', 'null']},
                            'week_start': {'bsonType': ['string', 'null']},
                            'week_end': {'bsonType': ['string', 'null']}
                        }
                    }
                }
            },
            'timesheets': {
                'validator': {
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['employee_id', 'week_start', 'week_end', 'status'],
                        'properties': {
                            'employee_id': {'bsonType': 'string'},
                            'employee_name': {'bsonType': ['string', 'null']},
                            'week_start': {'bsonType': 'string'},
                            'week_end': {'bsonType': 'string'},
                            'manager_id': {'bsonType': ['string', 'null']},
                            'manager_name': {'bsonType': ['string', 'null']},
                            'status': {'enum': ['pending', 'approved', 'rejected']},
                            'total_hours': {'bsonType': ['double', 'int', 'long']},
                            'attendance_records': {'bsonType': 'array'},
                            'submitted_at': {'bsonType': ['date', 'null']},
                            'reviewed_at': {'bsonType': ['date', 'null']},
                            'comments': {'bsonType': ['string', 'null']}
                        }
                    }
                }
            },
            'leaves': {
                'validator': {
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['employee_id', 'leave_type', 'start_date', 'end_date', 'status'],
                        'properties': {
                            'employee_id': {'bsonType': 'string'},
                            'employee_name': {'bsonType': ['string', 'null']},
                            'leave_type': {'enum': ['Paid Leave', 'Sick Leave', 'Unpaid Leave']},
                            'start_date': {'bsonType': 'string'},
                            'end_date': {'bsonType': 'string'},
                            'reason': {'bsonType': ['string', 'null']},
                            'status': {'enum': ['Pending', 'Approved', 'Rejected']},
                            'comment': {'bsonType': ['string', 'null']},
                            'created_at': {'bsonType': ['date', 'null']},
                            'updated_at': {'bsonType': ['date', 'null']}
                        }
                    }
                }
            },
            'managers': {
                'validator': {
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['manager_id', 'name', 'email'],
                        'properties': {
                            'manager_id': {'bsonType': 'string'},
                            'name': {'bsonType': 'string'},
                            'email': {'bsonType': 'string'},
                            'password': {'bsonType': 'string'},
                            'is_active': {'bsonType': 'bool'}
                        }
                    }
                }
            }
        }

        existing_collections = self._db.list_collection_names()

        for collection_name, options in collections.items():
            if collection_name not in existing_collections:
                try:
                    self._db.create_collection(collection_name, **options)
                    print(f"Created collection: {collection_name}")
                except CollectionInvalid:
                    print(f"Collection {collection_name} already exists")
                except Exception as e:
                    # If validation fails, create without validation
                    self._db.create_collection(collection_name)
                    print(f"Created collection {collection_name} without validation: {e}")
            else:
                # Update existing collection validator
                try:
                    self._db.command('collMod', collection_name, **options)
                    print(f"Updated validator for collection: {collection_name}")
                except Exception as e:
                    print(f"Could not update validator for {collection_name}: {e}")

        # Create indexes
        self._create_indexes()
        
        # Initialize default managers
        self._initialize_managers()

    def _create_indexes(self):
        """Create necessary indexes for better query performance"""
        # Users indexes
        self._db.users.create_index('email', unique=True)
        self._db.users.create_index('employee_id', unique=True, sparse=True)
        
        # OTP indexes
        self._db.otp_verifications.create_index('email')
        self._db.otp_verifications.create_index('expires_at', expireAfterSeconds=0)
        
        # Attendance indexes
        self._db.attendance.create_index([('employee_id', 1), ('date', 1)], unique=True)
        self._db.attendance.create_index('week_start')
        
        # Timesheets indexes
        self._db.timesheets.create_index([('employee_id', 1), ('week_start', 1)], unique=True)
        self._db.timesheets.create_index('manager_id')
        self._db.timesheets.create_index('status')
        
        # Leaves indexes
        self._db.leaves.create_index('employee_id')
        self._db.leaves.create_index('status')
        
        # Managers indexes
        self._db.managers.create_index('manager_id', unique=True)
        self._db.managers.create_index('email', unique=True)

    def _initialize_managers(self):
        """Initialize default managers if they don't exist"""
        import bcrypt
        from datetime import datetime
        
        manager_password = 'dayflowmanager123'
        
        for manager in Config.MANAGERS:
            existing = self._db.managers.find_one({'manager_id': manager['id']})
            hashed_password = bcrypt.hashpw(manager_password.encode('utf-8'), bcrypt.gensalt(Config.BCRYPT_ROUNDS))
            
            if existing:
                # Update existing manager password
                self._db.managers.update_one(
                    {'manager_id': manager['id']},
                    {'$set': {'password': hashed_password.decode('utf-8')}}
                )
                print(f"Updated manager password: {manager['name']}")
            else:
                self._db.managers.insert_one({
                    'manager_id': manager['id'],
                    'name': manager['name'],
                    'email': manager['email'],
                    'password': hashed_password.decode('utf-8'),
                    'is_active': True,
                    'created_at': datetime.utcnow()
                })
                print(f"Created manager: {manager['name']}")
        
        # Initialize default admin
        self._initialize_admin()
    
    def _initialize_admin(self):
        """Initialize default admin if doesn't exist"""
        import bcrypt
        from datetime import datetime
        
        admin = Config.DEFAULT_ADMIN
        existing = self._db.users.find_one({'employee_id': admin['employee_id']})
        if existing:
            # Update existing admin email and password
            hashed_password = bcrypt.hashpw(admin['password'].encode('utf-8'), bcrypt.gensalt(Config.BCRYPT_ROUNDS))
            self._db.users.update_one(
                {'employee_id': admin['employee_id']},
                {'$set': {
                    'email': admin['email'],
                    'password': hashed_password.decode('utf-8')
                }}
            )
            print(f"Updated admin: {admin['email']}")
        else:
            hashed_password = bcrypt.hashpw(admin['password'].encode('utf-8'), bcrypt.gensalt(Config.BCRYPT_ROUNDS))
            self._db.users.insert_one({
                'employee_id': admin['employee_id'],
                'email': admin['email'],
                'name': admin['name'],
                'password': hashed_password.decode('utf-8'),
                'role': 'admin',
                'is_verified': True,
                'department': 'Administration',
                'job_title': 'System Administrator',
                'created_at': datetime.utcnow()
            })
            print(f"Created default admin: {admin['email']}")

    @property
    def db(self):
        return self._db

    def get_collection(self, name):
        return self._db[name]


# Singleton instance
db_instance = Database()
db = db_instance.db
