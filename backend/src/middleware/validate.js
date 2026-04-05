/**
 * Joi validation middleware factory.
 * Takes a Joi schema and returns Express middleware that validates req.body.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    req.body = value; // use sanitized value
    next();
  };
};

module.exports = validate;
