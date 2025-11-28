<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-fish</v-icon>
            Fish Parameters Configuration
          </v-card-title>
          
          <v-card-text>
            <!-- Loading indicator -->
            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <!-- Form Section -->
            <v-form ref="form" v-model="valid" @submit.prevent="updateConfig">
              <v-row>
                <!-- Species Configuration Section -->
                <v-col cols="12" md="12">
                  <v-card outlined>
                    <v-card-title class="subtitle-1">
                      <v-icon left color="secondary">mdi-fishbowl</v-icon>
                      Species Parameters
                    </v-card-title>
                    <v-card-text>
                      <!-- Species Selection -->
                      <v-select
                        v-model="selectedSpecies"
                        :items="speciesOptions"
                        item-title="name"
                        item-value="name"
                        label="Select Species"
                        outlined
                        dense
                        @update:model-value="onSpeciesChange"
                        :rules="[rules.required]"
                      ></v-select>

                      <!-- Type Selection -->
                      <v-select
                        v-model="selectedType"
                        :items="typeOptions"
                        item-title="typeName"
                        item-value="typeName"
                        label="Select Type"
                        outlined
                        dense
                        :disabled="!selectedSpecies"
                        @update:model-value="onTypeChange"
                        :rules="[rules.required]"
                      ></v-select>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Parameters Section -->
              <v-row v-if="selectedType && currentParameters">
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title class="subtitle-1">
                      <v-icon left color="info">mdi-tune</v-icon>
                      Parameters for {{ selectedSpecies }} - {{ selectedType }}
                    </v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col
                          v-for="(value, key) in currentParameters"
                          :key="key"
                          cols="12"
                          sm="6"
                          md="3"
                        >
                          <v-text-field
                            v-model="currentParameters[key]"
                            :label="`Parameter ${key}`"
                            type="number"
                            :rules="[rules.positive]"
                            outlined
                            dense
                            clearable
                            hint="Leave empty for null value"
                            persistent-hint
                            @input="onParameterInput(key, $event.target.value)"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Current Values Display -->
              <v-row>
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title class="subtitle-1">
                      <v-icon left color="success">mdi-information</v-icon>
                      Current Configuration
                    </v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6" v-if="selectedSpecies && selectedType">
                          <v-chip color="secondary" outlined>
                            <v-icon left>mdi-fish</v-icon>
                            {{ selectedSpecies }} - {{ selectedType }}
                          </v-chip>
                        </v-col>
                      </v-row>
                      <v-row v-if="originalParameters">
                        <v-col cols="12">
                          <v-divider class="my-2"></v-divider>
                          <div class="text-subtitle-2 mb-2">Original Parameters:</div>
                          <v-chip
                            v-for="(value, key) in originalParameters"
                            :key="`orig-${key}`"
                            class="ma-1"
                            small
                            outlined
                          >
                            {{ key }}: {{ value === null ? 'null' : value }}
                          </v-chip>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Action Buttons -->
              <v-row class="mt-4">
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn
                    color="grey"
                    variant="outlined"
                    @click="resetForm"
                    class="mr-2"
                    :disabled="loading"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Reset
                  </v-btn>
                  <v-btn
                    color="primary"
                    type="submit"
                    :disabled="!valid || loading"
                    :loading="loading"
                  >
                    <v-icon left>mdi-content-save</v-icon>
                    Update Configuration
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Success/Error Modal -->
    <v-dialog v-model="showModal" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon
            :color="modalType === 'success' ? 'success' : 'error'"
            left
            size="28"
          >
            {{ modalType === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ modalType === 'success' ? 'Success' : 'Error' }}
        </v-card-title>
        
        <v-card-text>
          <p class="text-body-1">{{ modalMessage }}</p>
          <div v-if="modalType === 'success' && updateResult">
            <v-divider class="my-3"></v-divider>
            <div class="text-subtitle-2 mb-2">Updated Fields:</div>
            <v-chip
              v-for="field in updateResult.updated_fields"
              :key="field"
              class="ma-1"
              small
              color="success"
              outlined
            >
              {{ field }}
            </v-chip>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :color="modalType === 'success' ? 'success' : 'error'"
            variant="text"
            @click="closeModal"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from 'axios'
import config from '@/config'
import { mapState, mapGetters } from 'vuex'
import { warn } from 'vue';

export default {
  name: 'FishParameters',
  
  data() {
    return {
      valid: false,
      loading: false,
      showModal: false,
      modalType: 'success', // 'success' or 'error'
      modalMessage: '',
      updateResult: null,
      
      // Original configuration
      originalConfig: {},
      
      // Species and type selection
      selectedSpecies: null,
      selectedType: null,
      speciesOptions: [],
      typeOptions: [],
      currentParameters: null,
      originalParameters: null,
      
      // Validation rules
      rules: {
        required: value => {
          if (typeof value === 'number') return !isNaN(value) || 'This field is required'
          return !!value || 'This field is required'
        },
        positive: value => {
          if (value === null || value === undefined || value === '') return true
          return Number(value) >= 0 || 'Value must be positive'
        },
        parameterValue: value => {
          // Allow null, empty string, or positive numbers
          if (value === null || value === undefined || value === '') return true
          const numValue = Number(value)
          return !isNaN(numValue) && numValue >= 0 || 'Value must be a positive number or empty'
        }
      }
    }
  },
  
  computed: {
    url_server: () => config.url_server(),
    url_port: () => config.url_port(),
    url: () => config.url(),
  },
  
  async mounted() {
    await this.loadConfiguration()
  },
  
  methods: {
    async loadConfiguration() {
      this.loading = true
      try {
        const response = await axios.get(`${this.url_server}get_config`)
        
        this.originalConfig = response.data

        console.log('Loaded configuration:', this.originalConfig)
        
        // Set species options
        this.speciesOptions = this.originalConfig.species_params || []
        
        this.loading = false
      } catch (error) {
        console.error('Error loading configuration:', error)
        this.showErrorModal('Failed to load configuration. Please check your connection.')
        this.loading = false
      }
    },
    
    onSpeciesChange() {
      this.selectedType = null
      this.currentParameters = null
      this.originalParameters = null
      
      const species = this.speciesOptions.find(s => s.name === this.selectedSpecies)
      this.typeOptions = species ? species.types || [] : []
    },
    
    onTypeChange() {
      if (!this.selectedSpecies || !this.selectedType) {
        this.currentParameters = null
        this.originalParameters = null
        return
      }
      
      const species = this.speciesOptions.find(s => s.name === this.selectedSpecies)
      if (species) {
        const type = species.types.find(t => t.typeName === this.selectedType)
        if (type && type.parameters) {
          // Create a copy of parameters for editing, handling null values
          this.currentParameters = {}
          this.originalParameters = {}
          
          Object.keys(type.parameters).forEach(key => {
            const value = type.parameters[key]
            this.currentParameters[key] = value === null ? '' : value
            this.originalParameters[key] = value
          })
        }
      }
    },
    
    onParameterInput(key, value) {
      // Convert empty string to null, numbers to actual numbers
      if (value === '' || value === null || value === undefined) {
        this.currentParameters[key] = null
      } else {
        const numValue = Number(value)
        this.currentParameters[key] = isNaN(numValue) ? value : numValue
      }
    },
    
    async updateConfig() {
      if (!this.valid) return
      
      this.loading = true
      
      try {
        const updateData = {}
        
        // Add species parameters if selected and changed
        if (this.selectedSpecies && this.selectedType && this.currentParameters) {
          // Check if parameters changed
          const hasChanges = Object.keys(this.currentParameters).some(key => {
            const currentValue = this.currentParameters[key]
            const originalValue = this.originalParameters[key]
            
            // Convert empty string to null for comparison
            const normalizedCurrent = currentValue === '' ? null : currentValue
            
            return normalizedCurrent !== originalValue
          })
          
          if (hasChanges) {
            // Prepare parameters object with proper null handling
            const parameters = {}
            Object.keys(this.currentParameters).forEach(key => {
              const value = this.currentParameters[key]
              parameters[key] = value === '' ? null : value
            })
            
            updateData.species_params = {
              name: this.selectedSpecies,
              typeName: this.selectedType,
              parameters: parameters
            }
          }
        }
        
        // Check if there are any changes to send
        if (Object.keys(updateData).length === 0) {
          this.showErrorModal('No changes detected. Please modify at least one value.')
          this.loading = false
          return
        }
        
        const response = await axios.post(`${this.url_server}update_config`, updateData)
        
        if (response.status === 200) {
          this.updateResult = response.data
          this.showSuccessModal('Configuration updated successfully!')
          // Reload configuration to get updated values
          await this.loadConfiguration()
        }
        
      } catch (error) {
        console.error('Error updating configuration:', error)
        let errorMessage = 'Failed to update configuration.'
        
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error
        }
        
        this.showErrorModal(errorMessage)
      }
      
      this.loading = false
    },
    
    resetForm() {
      // Reset to original values
      if (this.originalParameters) {
        this.currentParameters = {}
        Object.keys(this.originalParameters).forEach(key => {
          const value = this.originalParameters[key]
          this.currentParameters[key] = value === null ? '' : value
        })
      }
      
      // Clear validation
      if (this.$refs.form) {
        this.$refs.form.resetValidation()
      }
    },
    
    showSuccessModal(message) {
      this.modalType = 'success'
      this.modalMessage = message
      this.showModal = true
    },
    
    showErrorModal(message) {
      this.modalType = 'error'
      this.modalMessage = message
      this.updateResult = null
      this.showModal = true
    },
    
    closeModal() {
      this.showModal = false
      this.modalMessage = ''
      this.updateResult = null
    }
  }
}
</script>

<style scoped>
.v-card {
  margin-bottom: 1rem;
}

.v-chip {
  margin: 2px;
}
</style>