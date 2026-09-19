const phonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vehicleNumberPattern = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}$/;
const licenseNumberPattern = /^[A-Z]{2}\d{2}\s?\d{4}\s?\d{7}$/;
const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const upiPattern = /^[\w.-]{2,}@[\w.-]{2,}$/;
export function validateDeliveryPartnerInput(input, options) {
    const errors = [];
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim() : '';
    const vehicleType = typeof input.vehicle_type === 'string' ? input.vehicle_type.trim().toLowerCase() : '';
    const vehicleNumber = typeof input.vehicle_number === 'string' ? input.vehicle_number.trim().toUpperCase() : '';
    const vehicleModel = typeof input.vehicle_model === 'string' ? input.vehicle_model.trim() : '';
    const licenseNumber = typeof input.license_number === 'string' ? input.license_number.trim().toUpperCase() : '';
    const bankAccount = typeof input.bank_account_number === 'string' ? input.bank_account_number.trim() : '';
    const ifsc = typeof input.ifsc_code === 'string' ? input.ifsc_code.trim().toUpperCase() : '';
    const upi = typeof input.upi_id === 'string' ? input.upi_id.trim() : '';
    if (name.length < 2 || name.length > 100 || !/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
        errors.push('Enter a valid full name.');
    }
    if (!phonePattern.test(phone))
        errors.push('Enter a valid 10-digit Indian mobile number.');
    if (email && !emailPattern.test(email))
        errors.push('Enter a valid email address.');
    if (!['bike', 'scooter', 'bicycle'].includes(vehicleType))
        errors.push('Select a valid vehicle type.');
    if (options.onboarding || vehicleNumber) {
        if (!vehicleNumberPattern.test(vehicleNumber))
            errors.push('Enter a valid vehicle number, for example MH12AB1234.');
    }
    if (options.onboarding || vehicleModel) {
        if (vehicleModel.length < 2 || vehicleModel.length > 100)
            errors.push('Enter a valid vehicle model.');
    }
    if (options.onboarding || licenseNumber) {
        if (!licenseNumberPattern.test(licenseNumber))
            errors.push('Enter a valid driving license number.');
    }
    if (options.onboarding || bankAccount) {
        if (!/^\d{9,18}$/.test(bankAccount))
            errors.push('Enter a valid bank account number.');
    }
    if (options.onboarding || ifsc) {
        if (!ifscPattern.test(ifsc))
            errors.push('Enter a valid IFSC code.');
    }
    if (upi && !upiPattern.test(upi))
        errors.push('Enter a valid UPI ID.');
    if (input.availability_type !== undefined && !['full_time', 'part_time'].includes(String(input.availability_type))) {
        errors.push('Select a valid availability type.');
    }
    return errors;
}
//# sourceMappingURL=deliveryValidation.js.map