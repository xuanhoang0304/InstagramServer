export class HttpResponse {
  static Paginate(result: any) {
    return {
      status: 'success',
      code: 200,
      message: 'Lấy dữ liệu thành công.',
      result,
    };
  }

  static created(data: any) {
    return {
      status: 'success',
      code: 201,
      message: 'Dữ liệu đã được tạo thành công.',
      data,
    };
  }
  static updated(data: any) {
    return {
      status: 'success',
      code: 200,
      message: 'Dữ liệu đã được cập nhật thành công.',
      data,
    };
  }
  static deleted(data: any) {
    return {
      status: 'success',
      code: 204,
      message: 'Dữ liệu đã xóa thành công.',
      data,
    };
  }
  static notFound(message = 'Không tìm thấy dữ liệu') {
    return {
      status: 'not-found',
      code: 404,
      message,
      error_code: 'NOT_FOUND',
    };
  }
  static login(result: any) {
    return {
      status: 'Login success',
      code: 200,
      result,
    };
  }
  static Unauthorized() {
    return {
      message: 'Token invalid or exprised',
      code: 400,
    };
  }
  static Forbidden(message = 'Permisstions deny') {
    return {
      message,
      code: 403,
    };
  }
}
