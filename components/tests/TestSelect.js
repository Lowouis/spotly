import React, {useState} from "react";
import SelectField from "@/components/form/SelectField";
import {
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    HeroUIProvider,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem
} from "@heroui/react";
import {FormProvider, useForm} from "react-hook-form";

export default function TestSelect() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const methods = useForm();

    return (
        <HeroUIProvider>
            <h2>Hors overlay</h2>
            <Select label="Select natif hors overlay" placeholder="Choisir">
                <SelectItem key="1" value="1">Option 1</SelectItem>
                <SelectItem key="2" value="2">Option 2</SelectItem>
            </Select>
            <FormProvider {...methods}>
                <form>
                    <SelectField
                        name="test"
                        label="SelectField hors overlay"
                        placeholder="Choisir"
                        options={"categories"}
                    />
                </form>
            </FormProvider>

            <Button onPress={() => setIsOpen(true)} color="primary" className="mt-4">Ouvrir le modal</Button>
            <Button onPress={() => setIsDrawerOpen(true)} color="secondary" className="ml-2 mt-4">Ouvrir le
                drawer</Button>

            {/* Modal */}
            <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Test dans Modal</ModalHeader>
                            <ModalBody>
                                <Select label="Select natif dans modal" placeholder="Choisir">
                                    <SelectItem key="1" value="1">Option 1</SelectItem>
                                    <SelectItem key="2" value="2">Option 2</SelectItem>
                                </Select>
                                <FormProvider {...methods}>
                                    <form>
                                        <SelectField
                                            name="test_modal"
                                            label="SelectField dans modal"
                                            placeholder="Choisir"
                                            options={"categories"}
                                        />
                                    </form>
                                </FormProvider>
                            </ModalBody>
                            <ModalFooter>
                                <Button onPress={onClose}>Fermer</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Drawer */}
            <Drawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} placement="right">
                <DrawerContent>
                    <DrawerHeader>Test dans Drawer</DrawerHeader>
                    <DrawerBody>
                        <Select label="Select natif dans drawer" placeholder="Choisir">
                            <SelectItem key="1" value="1">Option 1</SelectItem>
                            <SelectItem key="2" value="2">Option 2</SelectItem>
                        </Select>
                        <FormProvider {...methods}>
                            <form>
                                <SelectField
                                    name="test_drawer"
                                    label="SelectField dans drawer"
                                    placeholder="Choisir"
                                    options={"categories"}
                                />
                            </form>
                        </FormProvider>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button onPress={() => setIsDrawerOpen(false)}>Fermer</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </HeroUIProvider>
    );
}