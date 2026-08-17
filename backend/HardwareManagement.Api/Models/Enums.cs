namespace HardwareManagement.Api.Models;

public enum UserRole
{
    Developer = 1,
    NetworkAdmin = 2
}

public enum ItemWorkingStatus
{
    Working = 1,
    NotWorking = 2
}

public enum ScanStatus
{
    InProgress = 1,
    Completed = 2
}

public enum BarcodeQueueStatus
{
    Queued = 1,
    Printed = 2
}
