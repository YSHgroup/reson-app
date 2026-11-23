import { Prisma } from '../generated/prisma/client'

type ProjectWithAuthor = Prisma.ProjectGetPayload<{
  include: { author: true }
}>

type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: {
    applicant: true
    project: { include: { author: true } }
  }
}>

export function toLegacyProject(
  project: ProjectWithAuthor,
  applicationCount?: number
) {
  return {
    _id: project.id,
    author: project.author.email,
    title: project.title,
    startLine: project.startLine?.toISOString() ?? null,
    deadLine: project.deadline?.toISOString() ?? null,
    price: project.price,
    description: project.description,
    payType: project.payType,
    file: project.fileUrl,
    where: project.location,
    location:
      project.latitude === null || project.longitude === null
        ? null
        : { latitude: project.latitude, longitude: project.longitude },
    exist: project.status === 'CLOSED' ? 0 : 1,
    created_at: project.createdAt.getTime(),
    payUnit: project.payUnit,
    role: project.workMode,
    ...(applicationCount === undefined ? {} : { count: applicationCount }),
  }
}

export function toLegacyApplication(application: ApplicationWithRelations) {
  return {
    _id: application.id,
    author: application.applicant.email,
    poster: application.project.author.email,
    need_id: toLegacyProject(application.project),
    description: application.coverLetter,
    price: application.price,
    status:
      application.status === 'declined' ? 'rejected' : application.status,
    created_at: application.createdAt.getTime(),
    user: {
      _id: application.applicant.id,
      email: application.applicant.email,
      nickname: application.applicant.nickname,
      firstName: application.applicant.firstName,
      lastName: application.applicant.lastName,
      profession: application.applicant.profession,
      picpath: application.applicant.picturePath,
    },
  }
}
