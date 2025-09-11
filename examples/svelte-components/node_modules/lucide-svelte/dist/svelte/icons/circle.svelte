<script>import Icon from '../Icon.svelte';
const iconNode = [["circle", { "cx": "12", "cy": "12", "r": "10" }]];
</script>

<Icon name="circle" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
