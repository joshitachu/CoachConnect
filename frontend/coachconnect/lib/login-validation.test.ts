import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhoneNumber,
  validateCountry,
  validateSignupForm,
  validateLoginForm,
} from './login-validation'

describe('Email Validation', () => {
  describe('Valid emails', () => {
    test('accepts standard email format', () => {
      const result = validateEmail('test@example.com')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('accepts email with subdomain', () => {
      const result = validateEmail('user@mail.example.com')
      expect(result.isValid).toBe(true)
    })

    test('accepts email with numbers', () => {
      const result = validateEmail('user123@example.com')
      expect(result.isValid).toBe(true)
    })

    test('accepts email with dots in local part', () => {
      const result = validateEmail('first.last@example.com')
      expect(result.isValid).toBe(true)
    })

    test('accepts email with hyphen in domain', () => {
      const result = validateEmail('user@my-domain.com')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Invalid emails', () => {
    test('rejects empty email', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email is required')
    })

    test('rejects email without @', () => {
      const result = validateEmail('testexample.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must contain')
    })

    test('rejects email without domain', () => {
      const result = validateEmail('test@')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('domain')
    })

    test('rejects email without local part', () => {
      const result = validateEmail('@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('username')
    })

    test('rejects email without TLD', () => {
      const result = validateEmail('test@example')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('domain')
    })

    test('rejects email with spaces', () => {
      const result = validateEmail('test @example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('spaces')
    })

    test('rejects email with multiple @ symbols', () => {
      const result = validateEmail('test@@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('exactly one')
    })

    test('rejects email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      const result = validateEmail(longEmail)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too long')
    })

    test('rejects email with consecutive dots', () => {
      const result = validateEmail('test..user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('consecutive')
    })
  })
})

describe('Password Validation', () => {
  describe('Valid passwords', () => {
    test('accepts strong password', () => {
      const result = validatePassword('Test123!@#', 'user@example.com')
      expect(result.isValid).toBe(true)
    })

    test('accepts password with all required elements', () => {
      const result = validatePassword('MyPass123!', 'user@example.com')
      expect(result.isValid).toBe(true)
    })

    test('accepts password with multiple special characters', () => {
      const result = validatePassword('Secure@Pass#123', 'user@example.com')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Invalid passwords', () => {
    test('rejects empty password', () => {
      const result = validatePassword('', 'user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Password is required')
    })

    test('rejects password shorter than 8 characters', () => {
      const result = validatePassword('Test1!', 'user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 8')
    })

    test('rejects password without uppercase', () => {
      const result = validatePassword('test123!', 'user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('uppercase')
    })

    test('rejects password without lowercase', () => {
      const result = validatePassword('TEST123!', 'user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('lowercase')
    })

    test('rejects password without number', () => {
      const result = validatePassword('TestPass!', 'user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('number')
    })

    test('rejects password without special character', () => {
      const result = validatePassword('TestPass123', 'user@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('special character')
    })

    test('rejects password that matches email', () => {
      const result = validatePassword('Test@123', 'test@123')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('same as')
    })
  })
})

describe('Name Validation', () => {
  describe('Valid names', () => {
    test('accepts standard name', () => {
      const result = validateName('John', 'First name')
      expect(result.isValid).toBe(true)
    })

    test('accepts name with hyphen', () => {
      const result = validateName('Mary-Jane', 'First name')
      expect(result.isValid).toBe(true)
    })

    test('accepts name with apostrophe', () => {
      const result = validateName("O'Brien", 'Last name')
      expect(result.isValid).toBe(true)
    })

    test('accepts long name', () => {
      const result = validateName('Christopher', 'First name')
      expect(result.isValid).toBe(true)
    })

    test('accepts name with spaces', () => {
      const result = validateName('Van Der Berg', 'Last name')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Invalid names', () => {
    test('rejects empty name', () => {
      const result = validateName('', 'First name')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('First name is required')
    })

    test('rejects name that is too short', () => {
      const result = validateName('A', 'First name')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 2')
    })

    test('rejects name that is too long', () => {
      const longName = 'A'.repeat(51)
      const result = validateName(longName, 'First name')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('50 characters')
    })

    test('rejects name with numbers', () => {
      const result = validateName('John123', 'First name')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot contain numbers')
    })

    test('rejects name with special characters', () => {
      const result = validateName('John@Smith', 'First name')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('can only contain letters')
    })
  })
})

describe('Phone Number Validation', () => {
  describe('Valid phone numbers', () => {
    test('accepts standard 10-digit phone', () => {
      const result = validatePhoneNumber('1234567890')
      expect(result.isValid).toBe(true)
    })

    test('accepts phone with country code', () => {
      const result = validatePhoneNumber('+31612345678')
      expect(result.isValid).toBe(true)
    })

    test('accepts phone with spaces', () => {
      const result = validatePhoneNumber('06 1234 5678')
      expect(result.isValid).toBe(true)
    })

    test('accepts phone with dashes', () => {
      const result = validatePhoneNumber('06-1234-5678')
      expect(result.isValid).toBe(true)
    })

    test('accepts phone with parentheses', () => {
      const result = validatePhoneNumber('(06) 1234-5678')
      expect(result.isValid).toBe(true)
    })

    test('accepts 15-digit international phone', () => {
      const result = validatePhoneNumber('+123456789012345')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Invalid phone numbers', () => {
    test('rejects empty phone number', () => {
      const result = validatePhoneNumber('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Phone number is required')
    })

    test('rejects phone with less than 10 digits', () => {
      const result = validatePhoneNumber('12345')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 10')
    })

    test('rejects phone with more than 15 digits', () => {
      const result = validatePhoneNumber('1234567890123456')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('15 digits')
    })

    test('rejects phone with letters', () => {
      const result = validatePhoneNumber('123abc7890')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('can only contain')
    })

    test('rejects phone with all zeros', () => {
      const result = validatePhoneNumber('0000000000')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be all zeros')
    })

    test('rejects phone with invalid special characters', () => {
      const result = validatePhoneNumber('123@456#7890')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('can only contain')
    })
  })
})

describe('Country Validation', () => {
  test('accepts valid country', () => {
    const result = validateCountry('Netherlands')
    expect(result.isValid).toBe(true)
  })

  test('rejects empty country', () => {
    const result = validateCountry('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Country is required')
  })
})

describe('Signup Form Validation', () => {
  const validFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    phoneNumber: '+31612345678',
    country: 'Netherlands',
  }

  test('validates complete valid form', () => {
    const result = validateSignupForm(validFormData)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  test('returns all errors for invalid form', () => {
    const invalidData = {
      firstName: '',
      lastName: 'D',
      email: 'invalid-email',
      password: 'weak',
      phoneNumber: '123',
      country: '',
    }
    const result = validateSignupForm(invalidData)
    expect(result.isValid).toBe(false)
    expect(result.errors.firstName).toBeTruthy()
    expect(result.errors.lastName).toBeTruthy()
    expect(result.errors.email).toBeTruthy()
    expect(result.errors.password).toBeTruthy()
    expect(result.errors.phoneNumber).toBeTruthy()
    expect(result.errors.country).toBeTruthy()
  })

  test('validates first name correctly', () => {
    const result = validateSignupForm({
      ...validFormData,
      firstName: 'J',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.firstName).toContain('at least 2')
  })

  test('validates last name correctly', () => {
    const result = validateSignupForm({
      ...validFormData,
      lastName: 'Doe123',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.lastName).toContain('cannot contain numbers')
  })

  test('validates email correctly', () => {
    const result = validateSignupForm({
      ...validFormData,
      email: 'not-an-email',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeTruthy()
  })

  test('validates password correctly', () => {
    const result = validateSignupForm({
      ...validFormData,
      password: 'short',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBeTruthy()
  })

  test('validates phone number correctly', () => {
    const result = validateSignupForm({
      ...validFormData,
      phoneNumber: '123',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.phoneNumber).toBeTruthy()
  })

  test('validates country correctly', () => {
    const result = validateSignupForm({
      ...validFormData,
      country: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.country).toBeTruthy()
  })
})

describe('Login Form Validation', () => {
  test('validates valid login form', () => {
    const result = validateLoginForm({
      email: 'user@example.com',
      password: 'ValidPass123!',
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  test('rejects invalid email in login', () => {
    const result = validateLoginForm({
      email: 'invalid-email',
      password: 'ValidPass123!',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeTruthy()
  })

  test('rejects empty password in login', () => {
    const result = validateLoginForm({
      email: 'user@example.com',
      password: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBeTruthy()
  })

  test('rejects both invalid email and password', () => {
    const result = validateLoginForm({
      email: '',
      password: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeTruthy()
    expect(result.errors.password).toBeTruthy()
  })
})

describe('Edge Cases', () => {
  test('email validation handles whitespace', () => {
    const result = validateEmail('  test@example.com  ')
    expect(result.isValid).toBe(true)
  })

  test('password validation is case-sensitive', () => {
    const result1 = validatePassword('testpass123!', 'user@example.com')
    expect(result1.isValid).toBe(false)
    expect(result1.error).toContain('uppercase')
    
    const result2 = validatePassword('TESTPASS123!', 'user@example.com')
    expect(result2.isValid).toBe(false)
    expect(result2.error).toContain('lowercase')
  })

  test('name validation trims whitespace', () => {
    const result = validateName('  John  ', 'First name')
    expect(result.isValid).toBe(true)
  })

  test('phone validation extracts digits correctly', () => {
    const result = validatePhoneNumber('+31 (0)6 1234 5678')
    expect(result.isValid).toBe(true)
  })

  test('validates international phone formats', () => {
    expect(validatePhoneNumber('+1-800-555-5555').isValid).toBe(true)
    expect(validatePhoneNumber('+44 20 7946 0958').isValid).toBe(true)
    expect(validatePhoneNumber('+81 3-1234-5678').isValid).toBe(true)
  })
})
