import sys
import os
import unittest
from datetime import datetime, timedelta

# Adjust python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.auth_service import AuthService
from app.services.database import DatabaseService

class TestAuthenticationSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure database is initialized
        DatabaseService.initialize_db()

    def test_password_hashing(self):
        password = "SecurePassword123!"
        hashed = AuthService.hash_password(password)
        
        # Verify hash is secure (not plaintext)
        self.assertNotEqual(password, hashed)
        # Verify check works
        self.assertTrue(AuthService.verify_password(password, hashed))
        # Verify incorrect password fails
        self.assertFalse(AuthService.verify_password("wrongpassword", hashed))

    def test_password_strength_validation(self):
        # Too short
        self.assertIsNotNone(AuthService.validate_password_strength("Short1!"))
        # No number
        self.assertIsNotNone(AuthService.validate_password_strength("NoNumbersHere!"))
        # No uppercase
        self.assertIsNotNone(AuthService.validate_password_strength("nouppercase123!"))
        # No lowercase
        self.assertIsNotNone(AuthService.validate_password_strength("NOLOWERCASE123!"))
        # Perfect
        self.assertIsNone(AuthService.validate_password_strength("PerfectPassword123!"))

    def test_jwt_access_tokens(self):
        user_id = "test-uuid-user-123"
        token = AuthService.create_access_token(user_id)
        
        # Verify decoding recovers user id
        decoded_user = AuthService.verify_access_token(token)
        self.assertEqual(user_id, decoded_user)

    def test_jwt_expiration(self):
        # We can test encoding with past expiration to check verification returns None
        import jwt
        from app.services.auth_service import JWT_SECRET, JWT_ALGORITHM
        
        payload = {
            "sub": "expired-user",
            "exp": datetime.utcnow() - timedelta(minutes=5),
            "type": "access"
        }
        expired_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        self.assertIsNone(AuthService.verify_access_token(expired_token))

if __name__ == "__main__":
    unittest.main()
