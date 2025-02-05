class ApiResponse {
  constructor(status, message = "success", data = null) {
    this.status = status;
    this.message = message;
    this.success = status < 400;
    this.data = data;
  }
}

module.exports = ApiResponse;
