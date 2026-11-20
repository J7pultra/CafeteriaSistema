import api from './api'
import type { CoffeeSkillDescriptor, SkillExecutionResponse } from '../types'

export const skillService = {
  async getSkills(): Promise<CoffeeSkillDescriptor[]> {
    const response = await api.get<CoffeeSkillDescriptor[]>('/skills')
    return response.data
  },

  async executeSkill(
    skillId: string,
    parameters: Record<string, unknown> = {}
  ): Promise<SkillExecutionResponse> {
    const response = await api.post<SkillExecutionResponse>(
      `/skills/${skillId}/execute`,
      { parameters }
    )
    return response.data
  },
}

export default skillService
