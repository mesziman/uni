package Validator;

import Domain.Student;

public class StudentValidator extends BaseEntityStringValidator<Student> {

    /**
     * Validate a name.
     * @param name the name to be validated
     * @throws ValidationException if the name isn't valid
     */
    public void validateName(String name) throws ValidationException {
        if (name == null) {
            throw new ValidationException("Student must not be null");
        }

        if (name.length() < 3) {
            throw new ValidationException("Student must be at least 3 characters long");
        }

        String nameRegex = "[A-Z][a-z]+";
        if (!name.matches(nameRegex)) {
            throw new ValidationException("Student name must start with an uppercase letter " +
                    "followed by multiple lowercase letters");
        }
    }

    /**
     * Validate an email.
     * @param email the email to be validated
     * @throws ValidationException if the email isn't valid
     */
    public void validateEmail(String email) throws ValidationException {
        String emailRegex = "[a-z]{4}[1-9]{4}@scs.ubbcluj.ro";
        if (!email.matches(emailRegex)) {
            throw new ValidationException(("Given string isn't a valid email address."));
        }
    }

    @Override
    public void validate(Student student) throws ValidationException {
        super.validate(student);

        validateName(student.getFirstName());
        validateName(student.getLastName());
        validateEmail(student.getEmail());
    }
}