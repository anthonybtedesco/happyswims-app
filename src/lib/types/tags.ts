export interface Tag {
  id: string
  name: string
  color: string
}

export interface TagWithRelation {
  tag: Tag
  tag_id: string
}

export type EntityType = 'client' | 'instructor' | 'booking' | 'address' | 'student'

export interface TagDisplayProps {
  entityId: string
  entityType: EntityType
  tags: TagWithRelation[]
  onTagChange: () => void
}

export interface TagSelectorProps {
  entityId: string
  entityType: EntityType
  currentTags: Tag[]
  onDone: () => void
} 