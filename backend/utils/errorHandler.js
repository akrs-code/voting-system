export const handleMongoError = (error) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const value = error.keyValue[field];
        
        switch (field) {
            case 'studentId':
                return `An account with ID "${value}" is already registered.`;
            case 'email':
                return `The email address "${value}" is already in use.`;
            case 'name':
                return `A record with the name "${value}" already exists.`;
            default:
                return `This ${field} is already taken. Please use a unique value.`;
        }
    }
    
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return messages.join(', ');
    }
    
    return error.message || "An unexpected error occurred.";
};
