export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email is required" }
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail.includes(" ")) {
    return { isValid: false, error: "Email cannot contain spaces" }
  }

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: "Email is too long (max 254 characters)" }
  }

  if (!trimmedEmail.includes("@")) {
    return { isValid: false, error: "Email must contain @" }
  }

  const parts = trimmedEmail.split("@")
  if (parts.length !== 2) {
    return { isValid: false, error: "Email must contain exactly one @" }
  }

  const [localPart, domain] = parts

  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: "Email must have a username before @" }
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return { isValid: false, error: "Email cannot start or end with a dot" }
  }

  if (localPart.includes("..") || domain.includes("..")) {
    return { isValid: false, error: "Email cannot contain consecutive dots" }
  }

  const validLocalChars = /^[a-zA-Z0-9._-]+$/
  if (!validLocalChars.test(localPart)) {
    return { isValid: false, error: "Email contains invalid characters" }
  }

  if (!domain || domain.length === 0) {
    return { isValid: false, error: "Email must have a domain after @" }
  }

  if (!domain.includes(".")) {
    return { isValid: false, error: "Email domain must contain a dot" }
  }

  const domainParts = domain.split(".")
  const tld = domainParts[domainParts.length - 1]
  if (!tld || tld.length < 2) {
    return { isValid: false, error: "Email must have a valid domain extension" }
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: "Invalid email format" }
  }

  return { isValid: true }
}

export const validatePassword = (password: string, email?: string): { isValid: boolean; error?: string } => {
  if (!password || password.trim() === "") {
    return { isValid: false, error: "Password is required" }
  }

  if (password.includes(" ")) {
    return { isValid: false, error: "Password cannot contain spaces" }
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" }
  }

  if (password.length > 128) {
    return { isValid: false, error: "Password is too long (max 128 characters)" }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" }
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one special character (!@#$%^&*)" }
  }

  if (email && password.toLowerCase() === email.toLowerCase()) {
    return { isValid: false, error: "Password cannot be the same as your email" }
  }

  return { isValid: true }
}

export const validateName = (name: string, fieldName: string = "Name"): { isValid: boolean; error?: string } => {
  if (!name || name.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` }
  }

  const trimmedName = name.trim()

  if (trimmedName.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be only spaces` }
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` }
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName} is too long (max 50 characters)` }
  }

  if (/[0-9]/.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} cannot contain numbers` }
  }

  const validNameChars = /^[a-zA-Z\s'-]+$/
  if (!validNameChars.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` }
  }

  return { isValid: true }
}

export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Phone number is required" }
  }

  const trimmedPhone = phone.trim()

  const validPhoneChars = /^[0-9+\-\s()]+$/
  if (!validPhoneChars.test(trimmedPhone)) {
    return { isValid: false, error: "Phone number can only contain digits, +, -, and spaces" }
  }

  const digitsOnly = trimmedPhone.replace(/[^0-9]/g, "")

  if (digitsOnly.length < 10) {
    return { isValid: false, error: "Phone number must contain at least 10 digits" }
  }

  if (/^0+$/.test(digitsOnly)) {
    return { isValid: false, error: "Phone number cannot be all zeros" }
  }

  if (digitsOnly.length > 15) {
    return { isValid: false, error: "Phone number is too long (max 15 digits)" }
  }

  return { isValid: true }
}

export const validateCountry = (country: string): { isValid: boolean; error?: string } => {
  if (!country || country.trim() === "") {
    return { isValid: false, error: "Country is required" }
  }

  return { isValid: true }
}

export const validateSignupForm = (data: {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber: string
  country: string
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  const firstNameValidation = validateName(data.firstName, "First name")
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.error!
  }

  const lastNameValidation = validateName(data.lastName, "Last name")
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.error!
  }

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }

  const passwordValidation = validatePassword(data.password, data.email)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!
  }

  const phoneValidation = validatePhoneNumber(data.phoneNumber)
  if (!phoneValidation.isValid) {
    errors.phoneNumber = phoneValidation.error!
  }

  const countryValidation = validateCountry(data.country)
  if (!countryValidation.isValid) {
    errors.country = countryValidation.error!
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateLoginForm = (data: {
  email: string
  password: string
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }

  if (!data.password || data.password.trim() === "") {
    errors.password = "Password is required"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
