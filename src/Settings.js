import {
  ChakraProvider,
  Box,
  FormControl,
  FormLabel,
  Flex,
  Switch,
  Input,
  Select,
  Button,
} from "@chakra-ui/react";

function TreeForm({ formData, setFormData, handleSubmit, handleExport }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <ChakraProvider>
      <Flex
        p={4}
        maxW="400px"
        mx="auto"
        boxShadow="lg"
        height={"100vh"}
        flexDirection={"column"}
        overflow="hidden"
      >
        <Box mb={4} textAlign="center">
          <FormLabel fontSize="2xl" fontWeight="bold">
            Tree Generator
          </FormLabel>
          <FormLabel fontSize="sm" color="gray.500">
            Adjust the settings and click "Generate" to see the magic!
          </FormLabel>
        </Box>
        <Box flex={1} overflowY="auto" pr={1}>
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
            <FormLabel>Branching Density</FormLabel>
            <Select
              name="branchingDensity"
              value={formData.branchingDensity}
              onChange={handleChange}
            >
              <option value="dense">Dense</option>
              <option value="normal">Normal</option>
              <option value="sparse">Sparse</option>
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

          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="add-foliage" mb="0">
              Add Foliage
            </FormLabel>
            <Switch
              id="add-foliage"
              name="addFoliage"
              isChecked={formData.addFoliage}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Canopy Shape</FormLabel>
            <Select
              name="canopyShape"
              value={formData.canopyShape}
              onChange={handleChange}
            >
              <option value="sphere">Sphere (Oak / Maple)</option>
              <option value="cone">Cone (Pine / Fir)</option>
              <option value="cylinder">Cylinder (Poplar / Palm)</option>
              <option value="flat">Flat (Acacia / Cedar)</option>
              <option value="random">Random</option>
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Attractor Density</FormLabel>
            <Select
              name="attractorDensity"
              value={formData.attractorDensity}
              onChange={handleChange}
            >
              <option value="dense">Dense</option>
              <option value="normal">Normal</option>
              <option value="sparse">Sparse</option>
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>
              Upward Bias Strength:{" "}
              <strong>{parseFloat(formData.upwardBias).toFixed(1)}</strong>
            </FormLabel>
            <Input
              type="range"
              name="upwardBias"
              min="0"
              max="3"
              step="0.1"
              value={formData.upwardBias}
              onChange={handleChange}
            />
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

          <FormControl mb={4}>
            <FormLabel>Background Color</FormLabel>
            <Input
              type="color"
              name="backgroundColor"
              value={formData.backgroundColor}
              onChange={handleChange}
            />
          </FormControl>
        </Box>
        <Box display="flex" flexDirection="row" gap={2} pt={2}>
          <Button colorScheme="blue" width="full" onClick={handleSubmit}>
            Generate
          </Button>
          <Button colorScheme="green" width="full" onClick={handleExport}>
            Export
          </Button>
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default TreeForm;
