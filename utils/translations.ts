/**
 * Vietnamese translations for enum values used in farmer screens
 */

// Task Status translations
export const translateTaskStatus = (status: string): string => {
  const normalizedStatus = status?.trim() || '';
  
  switch (normalizedStatus.toLowerCase()) {
    case 'active':
      return 'Hoạt động';
    case 'inactive':
      return 'Không hoạt động';
    case 'todo':
    case 'to-do':
    case 'pending':
      return 'Chờ thực hiện';
    case 'inprogress':
        return 'Đang thực hiện';
    case 'in-progress':
        return 'Đang thực hiện';
    case 'in progress':
      return 'Đang thực hiện';
    case 'approved':
      return 'Đã duyệt';
    case 'completed':
    case 'done':
      return 'Hoàn thành';
    case 'emergency':
      return 'Khẩn cấp';
    case 'emergencyapproval':
    case 'emergency-approval':
      return 'Hoàn thành khẩn cấp';
    case 'cancelled':
    case 'canceled':
      return 'Đã hủy';
    default:
      return status; // Return original if no translation found
  }
};

// Priority translations
export const translatePriority = (priority: string): string => {
  const normalizedPriority = priority?.trim() || '';
  
  switch (normalizedPriority.toLowerCase()) {
    case 'low':
      return 'Thấp';
    case 'medium':
    case 'normal':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    default:
      return priority; // Return original if no translation found
  }
};

// Task Type translations
export const translateTaskType = (taskType: string): string => {
  const normalizedType = taskType?.trim() || '';
  
  switch (normalizedType.toLowerCase()) {
    case 'spraying':
      return 'Phun thuốc';
    case 'fertilizing':
      return 'Bón phân';
    case 'harvesting':
      return 'Thu hoạch';
    case 'irrigation':
      return 'Tưới tiêu';
    case 'planting':
      return 'Trồng trọt';
    case 'other':
      return 'Khác';
    default:
      return taskType; // Return original if no translation found
  }
};

// Report Type translations
export const translateReportType = (reportType: string): string => {
  const normalizedType = reportType?.trim() || '';
  
  switch (normalizedType.toLowerCase()) {
    case 'pest':
      return 'Sâu bệnh';
    case 'disease':
      return 'Bệnh';
    case 'weather':
      return 'Thời tiết';
    case 'other':
      return 'Khác';
    default:
      return reportType; // Return original if no translation found
  }
};

// Severity translations
export const translateSeverity = (severity: string): string => {
  const normalizedSeverity = severity?.trim() || '';
  
  switch (normalizedSeverity.toLowerCase()) {
    case 'low':
      return 'Thấp';
    case 'medium':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    case 'critical':
      return 'Nghiêm trọng';
    default:
      return severity; // Return original if no translation found
  }
};

// Helper function to translate an object with enum fields
export const translateEnumsInObject = <T extends Record<string, any>>(
  obj: T,
  fields: {
    status?: boolean;
    priority?: boolean;
    taskType?: boolean;
    reportType?: boolean;
    severity?: boolean;
  }
): T => {
  const translated = { ...obj };
  
  if (fields.status && translated.status) {
    translated.status = translateTaskStatus(translated.status);
  }
  
  if (fields.priority && translated.priority) {
    translated.priority = translatePriority(translated.priority);
  }
  
  if (fields.taskType && translated.taskType) {
    translated.taskType = translateTaskType(translated.taskType);
  }
  
  if (fields.reportType && translated.reportType) {
    translated.reportType = translateReportType(translated.reportType);
  }
  
  if (fields.severity && translated.severity) {
    translated.severity = translateSeverity(translated.severity);
  }
  
  return translated;
};

// Helper function to translate arrays of objects
export const translateEnumsInArray = <T extends Record<string, any>>(
  arr: T[],
  fields: {
    status?: boolean;
    priority?: boolean;
    taskType?: boolean;
    reportType?: boolean;
    severity?: boolean;
  }
): T[] => {
  return arr.map((item) => translateEnumsInObject(item, fields));
};

