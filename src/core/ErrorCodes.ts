export const ErrorCodes = {
  E10001: {
    type: 'generic',
    message: 'The requested resource was not found.',
    status: 404,
  },

  E10002: {
    type: 'generic',
    message: 'You are not authorized to perform this action.',
    status: 401,
  },

  E10003: {
    type: 'generic',
    message: 'Access to this resource is forbidden.',
    status: 403,
  },

  E10004: {
    type: 'generic',
    message: 'The data provided did not pass validation.',
    status: 400,
  },

  E10005: {
    type: 'generic',
    message: 'An unexpected error occurred on the server.',
    status: 500,
  },

  E10006: {
    type: 'generic',
    message: 'The request could not be understood by the server.',
    status: 400,
  },

  E10007: {
    type: 'generic',
    message: 'There is a conflict with the current state of the resource.',
    status: 409,
  },

  E10008: {
    type: 'generic',
    message: 'This feature is not implemented yet.',
    status: 501,
  },

  E10009: {
    type: 'generic',
    message: 'The service is currently unavailable.',
    status: 503,
  },

  E10010: {
    type: 'generic',
    message: 'The server timed out waiting for the request.',
    status: 408,
  },
};