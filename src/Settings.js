import {
  ChakraProvider,
  Box,
  FormControl,
  FormLabel,
  Flex,
  Switch,
  Input,
  RadioGroup,
  Radio,
  Stack,
  Select,
  Button,
} from "@chakra-ui/react";

function TreeForm({ formData, setFormData, handleSubmit }) {
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
      >
        <Box flex={1}>
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
              onChange={(value) =>
                setFormData({ ...formData, attractorShape: value })
              }
            >
              <Stack direction="row">
                <Radio value="random">Random</Radio>
                <Radio value="sphere">Circle</Radio>
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
        </Box>
        <Box>
          <Button colorScheme="blue" width="full" onClick={handleSubmit}>
            Generate Tree
          </Button>
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default TreeForm;
