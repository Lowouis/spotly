import {Input} from "@nextui-org/input";


export default function SiteForm({values}){
    return (
        <div className="flex flex-col space-y-3">
            <Input label="Nom" size="lg" variant="bordered" type="text" id="name" name="name"/>
            <Input label="Adresse" size="lg" variant="bordered" type="text" id="address" name="address"/>
            <Input label="N°" size="lg" variant="bordered" type="number" id="street_number" name="street_number"/>
            <Input label="Code Postal" size="lg" variant="bordered" type="number" id="country" name="country"/>
            <Input label="Téléphone" size="lg" variant="bordered" type="number" id="iso" name="iso"/>
        </div>

    );
}