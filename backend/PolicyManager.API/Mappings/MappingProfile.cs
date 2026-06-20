using AutoMapper;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Policy → PolicyDto
        CreateMap<Policy, PolicyDto>()
            .ForMember(d => d.PolicyTypeName, opt => opt.MapFrom(s => s.PolicyType != null ? s.PolicyType.Name : ""))
            .ForMember(d => d.CreatedByName, opt => opt.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.FullName : ""))
            .ForMember(d => d.FamilyMemberName, opt => opt.MapFrom(s => s.FamilyMember != null ? s.FamilyMember.Name : ""))
            .ForMember(d => d.AgeAtInception, opt => opt.MapFrom(s => s.AgeAtInception));

        // CreatePolicyDto → Policy
        CreateMap<CreatePolicyDto, Policy>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.MapFrom(_ => "Active"))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.IsDeleted, opt => opt.Ignore());

        // UpdatePolicyDto → Policy
        CreateMap<UpdatePolicyDto, Policy>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.CreatedByUserId, opt => opt.Ignore())
            .ForMember(d => d.IsDeleted, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

        // PolicyType
        CreateMap<PolicyType, PolicyTypeDto>().ReverseMap();

        // User
        CreateMap<User, UserDto>();
        CreateMap<RegisterDto, User>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.PasswordHash, opt => opt.Ignore())
            .ForMember(d => d.Role, opt => opt.MapFrom(_ => "User"))
            .ForMember(d => d.IsActive, opt => opt.MapFrom(_ => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

        // AuditLog
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User != null ? s.User.FullName : "System"));

        // PolicyReminderSetting
        CreateMap<PolicyReminderSetting, PolicyReminderSettingDto>()
            .ForMember(d => d.PolicyTypeName, opt => opt.MapFrom(s => s.PolicyType != null ? s.PolicyType.Name : ""));

        // Payment
        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.ProcessedByName, opt => opt.MapFrom(s => s.ProcessedBy != null ? s.ProcessedBy.FullName : "System"));
        CreateMap<CreatePaymentDto, Payment>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

        // PolicyDocument
        CreateMap<PolicyDocument, PolicyDocumentDto>()
            .ForMember(d => d.UploadedByName, opt => opt.MapFrom(s => s.UploadedBy != null ? s.UploadedBy.FullName : ""));

        // PolicyReminderEvent
        CreateMap<PolicyReminderEvent, PolicyReminderEventDto>();

        // FamilyMember
        CreateMap<FamilyMember, FamilyMemberDto>()
            .ForMember(d => d.ParentName, opt => opt.MapFrom(s => s.Parent != null ? s.Parent.Name : null))
            .ForMember(d => d.Children, opt => opt.Ignore()) // Handled manually or via specialized methods
            .ForMember(d => d.Policies, opt => opt.Ignore()); // Handled manually in Service

        CreateMap<FamilyMemberDto, FamilyMember>();
        CreateMap<CreateFamilyMemberDto, FamilyMember>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.Policies, opt => opt.Ignore());

        // FamilyMember Policy Summary
        CreateMap<Policy, FamilyMemberPolicySummaryDto>()
            .ForMember(d => d.PolicyTypeName, opt => opt.MapFrom(s => s.PolicyType != null ? s.PolicyType.Name : ""));

        // MutualFund Mappings
        CreateMap<MutualFund, MutualFundDto>()
            .ForMember(d => d.FamilyMemberName, opt => opt.MapFrom(s => s.FamilyMember != null ? s.FamilyMember.Name : ""))
            .ForMember(d => d.FamilyMemberRelationship, opt => opt.MapFrom(s => s.FamilyMember != null ? s.FamilyMember.Relationship : ""))
            .ForMember(d => d.CreatedByName, opt => opt.MapFrom(s => s.CreatedByUser != null ? s.CreatedByUser.FullName : ""));

        CreateMap<CreateMutualFundDto, MutualFund>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.FamilyMember, opt => opt.Ignore())
            .ForMember(d => d.CreatedByUserId, opt => opt.Ignore())
            .ForMember(d => d.CreatedByUser, opt => opt.Ignore());

        CreateMap<UpdateMutualFundDto, MutualFund>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.FamilyMember, opt => opt.Ignore())
            .ForMember(d => d.CreatedByUserId, opt => opt.Ignore())
            .ForMember(d => d.CreatedByUser, opt => opt.Ignore());

        // Upcoming Installment Mappings
        CreateMap<Policy, UpcomingInstallmentDto>()
            .ForMember(d => d.PolicyId, opt => opt.MapFrom(s => s.Id))
            .ForMember(d => d.PolicyTypeName, opt => opt.MapFrom(s => s.PolicyType != null ? s.PolicyType.Name : ""))
            .ForMember(d => d.DaysUntilDue, opt => opt.MapFrom(s => s.NextInstallmentDate.HasValue ? (int)(s.NextInstallmentDate.Value.Date - DateTime.UtcNow.Date).TotalDays : 0))
            .ForMember(d => d.IsOverdue, opt => opt.MapFrom(s => s.NextInstallmentDate.HasValue && s.NextInstallmentDate.Value.Date < DateTime.UtcNow.Date))
            .ForMember(d => d.UrgencyLevel, opt => opt.MapFrom(s => 
                !s.NextInstallmentDate.HasValue ? "info" :
                (s.NextInstallmentDate.Value.Date < DateTime.UtcNow.Date) ? "critical" :
                ((s.NextInstallmentDate.Value.Date - DateTime.UtcNow.Date).TotalDays <= 7) ? "warning" : "info"));

        // DateOnly support for AutoMapper 12
        CreateMap<DateOnly, DateOnly>().ConvertUsing(s => s);
        CreateMap<DateOnly?, DateOnly?>().ConvertUsing(s => s);
    }
}
