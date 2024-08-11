import {
  ChakraProvider,
  Box,
  FormControl,
  FormLabel,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Input,
  RadioGroup,
  Radio,
  Stack,
  Select,
  Button,
} from "@chakra-ui/react";

function TreeForm({formData, setFormData}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <ChakraProvider>
      <Box p={4} maxW="400px" mx="auto" boxShadow="lg" borderRadius="md">
        <FormControl display="flex" alignItems="center" mb={4}>
          <FormLabel htmlFor="show-nodes" mb="0">
            Show Nodes
          </FormLabel>
          <Switch
            id="show-nodes"
            name="showNodes"
            isChecked={formData.showNodes}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center" mb={4}>
          <FormLabel htmlFor="show-attractors" mb="0">
            Show Attractors
          </FormLabel>
          <Switch
            id="show-attractors"
            name="showAttractors"
            isChecked={formData.showAttractors}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Radius of Influence</FormLabel>
          <Slider
            name="radiusOfInfluence"
            defaultValue={formData.radiusOfInfluence}
            min={1}
            max={10}
            onChange={(value) => setFormData({ ...formData, radiusOfInfluence: value })}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Displacement of Vectors</FormLabel>
          <Slider
            name="displacementOfVectors"
            defaultValue={formData.displacementOfVectors}
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => setFormData({ ...formData, displacementOfVectors: value })}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>No of Iterations</FormLabel>
          <Slider
            name="noOfIterations"
            defaultValue={formData.noOfIterations}
            min={0}
            max={200}
            onChange={(value) => setFormData({ ...formData, noOfIterations: value })}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Minimum Distance Between Nodes</FormLabel>
          <Slider
            name="minDistanceBetweenNodes"
            defaultValue={formData.minDistanceBetweenNodes}
            min={0}
            max={10}
            onChange={(value) => setFormData({ ...formData, minDistanceBetweenNodes: value })}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Branching Density</FormLabel>
          <Select
            name="branchingDensity"
            value={formData.branchingDensity}
            onChange={handleChange}
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="dense">Dense</option>
          </Select>
        </FormControl>

        <FormControl display="flex" alignItems="center" mb={4}>
          <FormLabel htmlFor="add-jitter" mb="0">
            Add Jitter
          </FormLabel>
          <Switch
            id="add-jitter"
            name="addJitter"
            isChecked={formData.addJitter}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Attractor Shape</FormLabel>
          <RadioGroup
            name="attractorShape"
            value={formData.attractorShape}
            onChange={(value) => setFormData({ ...formData, attractorShape: value })}
          >
            <Stack direction="row">
              <Radio value="random">Random</Radio>
              <Radio value="circle">Circle</Radio>
              <Radio value="others">Others</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Attractor Density</FormLabel>
          <Select
            name="attractorDensity"
            value={formData.attractorDensity}
            onChange={handleChange}
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="dense">Dense</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Tree Color</FormLabel>
          <Input
            type="color"
            name="treeColor"
            value={formData.treeColor}
            onChange={handleChange}
          />
        </FormControl>

        <Button colorScheme="teal" width="full">
          Apply Settings
        </Button>
      </Box>
    </ChakraProvider>
  );
}

export default TreeForm;