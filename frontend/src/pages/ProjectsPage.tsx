import { useProjectsListFlow } from '@/hooks/projects/useProjectsListFlow'
import { ProjectsListView } from '@/views/projects'
import { AnimatedPage } from '@/components/animation'

export default function ProjectsPage() {
  const {
    projects,
    isLoading,
    fetchError,
    createForm,
    openCreateForm,
    closeCreateForm,
    setCreateField,
    handleCreate,
    handleDelete,
    navigateToProject,
    isCreating,
    isDeleting,
    deletingId,
  } = useProjectsListFlow()

  return (
    <AnimatedPage>
      <ProjectsListView
        projects={projects}
        isLoading={isLoading}
        fetchError={fetchError}
        createFormOpen={createForm.isOpen}
        createFormData={{ name: createForm.name, description: createForm.description }}
        createFormErrors={createForm.errors}
        onOpenCreateForm={openCreateForm}
        onCloseCreateForm={closeCreateForm}
        onCreateFieldChange={setCreateField}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onProjectClick={navigateToProject}
        isCreating={isCreating}
        isDeleting={isDeleting}
        deletingId={deletingId}
      />
    </AnimatedPage>
  )
}
