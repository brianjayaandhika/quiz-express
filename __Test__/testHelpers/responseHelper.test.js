import responseHelper from '../../helpers/responseHelper.js'; // Replace with the correct path to your responseHelper file

describe('responseHelper', () => {
  let mockStatus;
  let mockJson;
  let mockRes;

  beforeEach(() => {
    mockStatus = jest.fn();
    mockJson = jest.fn();
    mockRes = {
      status: mockStatus.mockReturnThis(),
      json: mockJson,
    };
  });

  it('should return a success response with status 200 and data', () => {
    const data = { username: 'admin', password: '1234', email: 'admin@admin.com', role: 'admin', verified: false };
    const message = 'Success!';
    responseHelper(mockRes, 200, data, message);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'Success',
      statusCode: 200,
      data,
      message,
    });
  });

  it('should return a success response with status 200 and no data', () => {
    const message = 'Success!';
    responseHelper(mockRes, 200, null, message);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'Success',
      statusCode: 200,
      message,
    });
  });

  it('should return an error response with status 400 and custom message', () => {
    const message = 'Bad request';
    responseHelper(mockRes, 400, null, message);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'Error',
      statusCode: 400,
      message,
    });
  });

  it("should return an error response with status 404 and 'Api Not Found' message", () => {
    responseHelper(mockRes, 404);
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'Error',
      statusCode: 404,
    });
  });

  it("should return an error response with status 500 and 'Internal Server Error' message", () => {
    responseHelper(mockRes, 500);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'Error',
      statusCode: 500,
      message: 'Internal Server Error',
    });
  });
});
